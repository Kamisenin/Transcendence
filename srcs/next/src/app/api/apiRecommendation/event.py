from fastapi import HTTPException
from database import get_connection

EVENT_WEIGHTS = {
    "visit": 0.2,
    "favorite": 1.0,
    "dislike": -0.8,
    "cancel_favorite" : -1,
    "cancel_dislike" : 0.8,
}


def process_event(user_id, page_id, event):

    # Vérification de l'événement
    if event not in EVENT_WEIGHTS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown event: {event}"
        )

    event_weight = EVENT_WEIGHTS[event]

    with get_connection() as conn:
        with conn.cursor() as cursor:

            # ---------------------------------------
            # Récupérer les tags de la page
            # ---------------------------------------
            cursor.execute(
                """
                SELECT tag_id
                FROM tag_pages
                WHERE page_id = %s
                """,
                (page_id,)
            )

            tags = cursor.fetchall()

            if not tags:
                raise HTTPException(
                    status_code=404,
                    detail="Page has no tags"
                )

            # ---------------------------------------
            # Modifier le profil utilisateur
            # ---------------------------------------
            for (tag_id,) in tags:
                cursor.execute(
                    """
                    SELECT idf
                    FROM tag_statistics
                    WHERE tag_id = %s
                    """,
                    (tag_id,)
                )

                result = cursor.fetchone()

                # Si le tag n'a pas encore de statistique IDF, on prend 1.0 par défaut au lieu de skiper
                idf = float(result[0]) if result is not None else 1.0

                value = event_weight * idf

                # Ajouter au vecteur utilisateur
                cursor.execute(
                    """
                    INSERT INTO user_tag_interests (user_id, tag_id, weight)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, tag_id)
                    DO UPDATE SET weight = user_tag_interests.weight + EXCLUDED.weight
                    """,
                    (
                        user_id,
                        tag_id,
                        value
                    )
                )

        conn.commit()
