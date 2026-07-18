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


def weight_tags(data):
    lst_tags = {}
    count = 0

    for item in data:  
        for tag in item["tags"]:    
            
            count += 1
            if tag in lst_tags:
                lst_tags[tag] += 1
            else:
                lst_tags[tag] = 1

    print("weight tag :")
    print(lst_tags)

    for tag in lst_tags:
        lst_tags[tag] = round(math.log(lst_tags[tag] + 1 / count + 1) + 1, 4)
    return lst_tags


def build_user_profile(data, user_id, weight_tag):
    profile = defaultdict(float)

    for row in data:

        # On garde seulement les actions de cet utilisateur
        if row["user_id"] != user_id:
            continue

        # Ajout du poids à chaque tag
        for tag in row["tags"]:
            profile[tag] += round(EVENT_WEIGHTS[row["event"]] * weight_tag[tag], 4)

    return dict(profile)


def calculate_channel_score(user_profile, channel_tags):
    score = 0.0

    for tag in channel_tags:
        score += user_profile.get(tag, 0.0)

    return score


# -------------------------------------{ Programme principal }------------------------------------- #

data = load_data("../data/test.csv")

user_id = 1

weight_tags = weight_tags(data)

print("\nweight tag :")
print(weight_tags)

profile = build_user_profile(data, user_id, weight_tags)

print("\nProfil utilisateur :")
print(profile)

print("\nScores des channels :")

# Récupération des channels uniques
channels = {}

for row in data:
    channels[row["channel_id"]] = row["tags"]


# Calcul du score pour chaque channel
for channel_id, tags in channels.items():

    score = calculate_channel_score(profile, tags)

    print(
        "Channel:",
        channel_id,
        "| Tags:",
        tags,
        "| Score:",
        score
    )