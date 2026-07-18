import csv
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


def build_user_profile(data, user_id):
    profile = defaultdict(float)

    for row in data:

        # On garde seulement les actions de cet utilisateur
        if row["user_id"] != user_id:
            continue

        # Récupération du poids de l'événement
        weight = EVENT_WEIGHTS[row["event"]]

        # Ajout du poids à chaque tag
        for tag in row["tags"]:
            profile[tag] += weight

    return dict(profile)


def calculate_channel_score(user_profile, channel_tags):
    score = 0.0

    for tag in channel_tags:
        score += user_profile.get(tag, 0.0)

    return score


# -------------------------------------{ Programme principal }------------------------------------- #

data = load_data("../data/test.csv")

user_id = 1

profile = build_user_profile(data, user_id)

print("Profil utilisateur :")
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