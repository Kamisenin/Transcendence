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

    # nombre de channels
    nb_channels = len(set(row["channel_id"] for row in data))

    for row in data:

        unique_tags = set(row["tags"])

        for tag in unique_tags:
            df[vocabulary[tag]] += 1

    idf = {}

    for index, count in df.items():
        idf[index] = round(math.log((nb_channels + 1) / (count + 1)) + 1, 4)

    return idf


def build_user_profile(data, user_id, vocabulary, idf):

    profile = defaultdict(float)

    for row in data:

        if row["user_id"] != user_id:
            continue

        weight = EVENT_WEIGHTS[row["event"]]

        for tag in row["tags"]:

            index = vocabulary[tag]

            profile[index] += round(weight * idf[index], 4)

    return dict(profile)


def build_channel_vectors(data, vocabulary, idf):

    channels = {}

    for row in data:

        cid = row["channel_id"]

        if cid not in channels:
            channels[cid] = {}

        for tag in row["tags"]:

            index = vocabulary[tag]

            channels[cid][index] = idf[index]

    return channels


def cosine_similarity(user_vector, channel_vector):

    produit = 0.0

    for index in user_vector:

        if index in channel_vector:
            produit += (
                user_vector[index]
                *
                channel_vector[index]
            )

    norm_user = 0.0

    for value in user_vector.values():
        norm_user += value * value

    norm_user = math.sqrt(norm_user)

    norm_channel = 0.0

    for value in channel_vector.values():
        norm_channel += value * value

    norm_channel = math.sqrt(norm_channel)

    if norm_user == 0 or norm_channel == 0:
        return 0

    return round(produit / (norm_user * norm_channel), 4)

# -------------------------------------{ Programme principal }------------------------------------- #

data = load_data("../data/test.csv")

user_id = 1

# Construction des structures
vocabulary = build_vocabulary(data)
idf = weight_tags(data, vocabulary)
profile = build_user_profile(data, user_id, vocabulary, idf)
channel_vectors = build_channel_vectors(data, vocabulary, idf)

print("\nVocabulary :")
print(vocabulary)

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
        vector,
        "| Similarity:",
        cosine_similarity(profile, vector)
    )


    