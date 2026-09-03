import math

from database import get_connection


def update_tag_statistics():

    with get_connection() as conn:

        with conn.cursor() as cursor:

            # ---------------------------------------
            # Nombre total de pages
            # ---------------------------------------

            cursor.execute(
                """
                SELECT COUNT(*)
                FROM pages
                """
            )

            number_of_pages = cursor.fetchone()[0]


            # Pas de page
            if number_of_pages == 0:
                return


            # ---------------------------------------
            # Document Frequency
            # ---------------------------------------

            cursor.execute(
                """
                SELECT
                    tag_id,
                    COUNT(*) AS document_frequency

                FROM tag_pages

                GROUP BY tag_id
                """
            )

            rows = cursor.fetchall()


            # ---------------------------------------
            # Calcul IDF
            # ---------------------------------------

            for tag_id, document_frequency in rows:

                idf = math.log(
                    (number_of_pages + 1)
                    /
                    (document_frequency + 1)
                ) + 1


                cursor.execute(
                    """
                    INSERT INTO tag_statistics
                        (
                            tag_id,
                            document_frequency,
                            idf
                        )

                    VALUES
                        (%s, %s, %s)

                    ON CONFLICT (tag_id)

                    DO UPDATE SET

                        document_frequency =
                            EXCLUDED.document_frequency,

                        idf =
                            EXCLUDED.idf
                    """,
                    (
                        tag_id,
                        document_frequency,
                        idf
                    )
                )


            # ---------------------------------------
            # Supprimer les statistiques inutilisées
            # ---------------------------------------

            cursor.execute(
                """
                DELETE FROM tag_statistics

                WHERE tag_id NOT IN (
                    SELECT DISTINCT tag_id
                    FROM tag_pages
                )
                """
            )


        conn.commit()