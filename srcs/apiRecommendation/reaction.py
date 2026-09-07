from fastapi import HTTPException

from database import get_connection


VALID_REACTIONS = {
    "FAVORITE",
    "DISLIKE",
}


def set_reaction(user_id: str, page_id: int, reaction: str):
    reaction = reaction.upper()

    if reaction not in VALID_REACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown reaction: {reaction}"
        )

    with get_connection() as conn:
        with conn.cursor() as cursor:

            # Vérifier que la page existe
            cursor.execute(
                """
                SELECT 1
                FROM pages
                WHERE page_id = %s
                """,
                (page_id,)
            )

            if cursor.fetchone() is None:
                raise HTTPException(
                    status_code=404,
                    detail="Page not found"
                )

            # Ajouter ou modifier la réaction
            cursor.execute(
                """
                INSERT INTO page_reactions
                    (user_id, page_id, type)
                VALUES
                    (%s, %s, %s)
                ON CONFLICT (user_id, page_id)
                DO UPDATE SET
                    type = EXCLUDED.type
                """,
                (
                    user_id,
                    page_id,
                    reaction
                )
            )

        conn.commit()


def delete_reaction(user_id: str, page_id: int):

    with get_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                DELETE FROM page_reactions
                WHERE user_id = %s
                  AND page_id = %s
                """,
                (
                    user_id,
                    page_id
                )
            )

        conn.commit()


def get_favorites(user_id: str):

    with get_connection() as conn:
        with conn.cursor() as cursor:

            cursor.execute(
                """
                SELECT page_id
                FROM page_reactions
                WHERE user_id = %s
                  AND type = 'FAVORITE'
                ORDER BY created_at DESC
                """,
                (user_id,)
            )

            rows = cursor.fetchall()

    return [row[0] for row in rows]


def get_reaction(user_id: str, page_id: int):
    with get_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT type
                FROM page_reactions
                WHERE user_id = %s
                  AND page_id = %s
                """,
                (user_id, page_id)
            )

            result = cursor.fetchone()

    return result[0] if result else None