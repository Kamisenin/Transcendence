import csv
import math
from collections import defaultdict

# Poids de chaque interaction
EVENT_WEIGHTS = {
    "visit": 0.3,
    "message": 1.0,
    "stay": 0.6,
    "like": 0.8,
    "quit": -0.2
}


def build_vocabulary(data):
    vocabulary = {}

    for row in data:
        for tag in row["tags"]:
            if tag not in vocabulary:
                vocabulary[tag] = len(vocabulary)

    return vocabulary


def load_data(filename):
    data = []

    with open(filename, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            data.append({
                "user_id": int(row["id_user"]),
                "channel_id": int(row["id_channel"]),
                "event": row["event"],
                "tags": row["tags"].split()
            })

    return data


def weight_tags(data, vocabulary):

    df = defaultdict(int)

    nb_channels = len(set(row["channel_id"] for row in data))

    for row in data:

        unique_tags = set(row["tags"])

        for tag in unique_tags:
            df[vocabulary[tag]] += 1

    idf = {}

    for index, count in df.items():
        idf[index] = math.log((nb_channels + 1) / (count + 1)) + 1

    return idf


def build_user_profile(data, user_id, vocabulary, idf):

    profile = {
        "vector": defaultdict(float),
        "norm": 0.0
    }

    for row in data:

        if row["user_id"] != user_id:
            continue

        weight = EVENT_WEIGHTS[row["event"]]

        for tag in row["tags"]:

            index = vocabulary[tag]

            profile["vector"][index] += weight * idf[index]

    norm_user = 0.0

    for value in profile["vector"].values():
        norm_user += value * value

    profile["norm"] = math.sqrt(norm_user)

    return dict(profile)


def build_channel_vectors(data, vocabulary, idf):

    channels = {}

    for row in data:

        cid = row["channel_id"]

        if cid not in channels:
            channels[cid] = {
                "vector": {},
                "norm": 0
            }

        norm_channel = 0.0

        for tag in row["tags"]:

            index = vocabulary[tag]

            value = idf[index]

            channels[cid]["vector"][index] = value

            norm_channel += value * value


        channels[cid]["norm"] = math.sqrt(norm_channel)

    return channels


def cosine_similarity(user, channel):

    produit = 0.0

    for index in user["vector"]:

        if index in channel["vector"]:

            produit += (
                user["vector"][index]
                *
                channel["vector"][index]
            )

    if user["norm"] == 0 or channel["norm"] == 0:
        return 0

    return round(produit / (user["norm"] * channel["norm"]), 4)

# -------------------------------------{ Main }------------------------------------- #

data = load_data("../data/test.csv")

user_id = 1

# ============== { def struct }

vocabulary = build_vocabulary(data)
idf = weight_tags(data, vocabulary)
profile = build_user_profile(data, user_id, vocabulary, idf)
channel_vectors = build_channel_vectors(data, vocabulary, idf)

# ============== { test }

print("\nVocabulary :")
print(vocabulary, 4)

print("\nIDF :")
print(idf)

print("\nProfil utilisateur :")
print(profile)

print("\nVecteurs des channels :")


for channel_id, vector in channel_vectors.items():

    print(
    "Channel:",
    channel_id,
    "| Vector:",
    {
        k: round(v, 4)
        for k, v in vector["vector"].items()
    },
    "| Norm:",
    round(vector["norm"], 4),
    "| Similarity:",
    cosine_similarity(profile, vector))

# ============== { result }
print("\nRecommendation :")


results = []

for channel_id, vector in channel_vectors.items():

    score = cosine_similarity(profile, vector)

    results.append(
        (channel_id, score)
    )


top_3 = sorted(
    results,
    key=lambda x: x[1],
    reverse=True
)[:3]

for channel_id, score in top_3:

    print(
        "Channel:",
        channel_id,
        "| Similarity:",
        score
    )