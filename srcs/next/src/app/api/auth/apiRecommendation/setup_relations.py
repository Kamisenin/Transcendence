import psycopg
from statistics import update_tag_statistics

DATABASE_URL = "postgresql://website_db_admin:pass@localhost:5432/WEBSITE"

try:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            print("--- 1. Association des pages aux tags (tag_pages) ---")
            links = [
                (1, 1), # Page 1 -> Tag 1 (crevette)
                (8, 2), # Page 8 -> Tag 2 (test)
                (2, 3)  # Page 2 -> Tag 3 (42)
            ]
            for page_id, tag_id in links:
                cur.execute("""
                    INSERT INTO tag_pages (page_id, tag_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING;
                """, (page_id, tag_id))
            print("✔ Relations tag_pages créées.")
        conn.commit()

    print("\n--- 2. Calcul automatique de l'IDF (tag_statistics) ---")
    update_tag_statistics()
    print("✔ Statistiques IDF calculées avec succès !")

except Exception as e:
    print("Erreur :", e)
