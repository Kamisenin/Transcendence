import psycopg

DATABASE_URL = "postgresql://website_db_admin:pass@localhost:5432/WEBSITE"

USER_JAINEKO = "5cfd3b8c-2491-407a-8b36-38dcdc0ca447"
USER_THCAQUET = "53e7ef30-7cf7-4bfe-a234-fa30400bbc5e"

TAG_CREVETTE = 1
TAG_TEST = 2
TAG_42 = 3

try:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            print("--- 1. Injection des statistiques des Tags (tag_statistics) ---")
            # Tag 1 (crevette) : rare et pertinent (IDF élevé)
            # Tag 2 (test) : très commun (IDF bas)
            # Tag 3 (42) : moyennement populaire (IDF moyen)
            tag_stats = [
                (TAG_CREVETTE, 2, 1.8),
                (TAG_TEST, 10, 0.5),
                (TAG_42, 5, 1.2)
            ]
            for tag_id, doc_freq, idf in tag_stats:
                cur.execute("""
                    INSERT INTO tag_statistics (tag_id, document_frequency, idf)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (tag_id) DO UPDATE 
                    SET document_frequency = EXCLUDED.document_frequency, idf = EXCLUDED.idf;
                """, (tag_id, doc_freq, idf))
            print("✔ Statistiques des tags ajoutées.")

            print("\n--- 2. Injection des intérêts utilisateurs (user_tag_interests) ---")
            # Jaineko adore 'crevette' (poids 0.9), aime un peu '42' (poids 0.4), délaisse 'test' (poids 0.1)
            interests = [
                (USER_JAINEKO, TAG_CREVETTE, 0.90),
                (USER_JAINEKO, TAG_42, 0.40),
                (USER_JAINEKO, TAG_TEST, 0.10),
                # thcaquet adore '42' et 'test'
                (USER_THCAQUET, TAG_42, 0.85),
                (USER_THCAQUET, TAG_TEST, 0.70)
            ]
            for user_id, tag_id, weight in interests:
                cur.execute("""
                    INSERT INTO user_tag_interests (user_id, tag_id, weight)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id, tag_id) DO UPDATE 
                    SET weight = EXCLUDED.weight;
                """, (user_id, tag_id, weight))
            print("✔ Intérêts utilisateurs ajoutés.")

        conn.commit()
        print("\n✨ Données de test injectées avec succès dans PostgreSQL !")

except Exception as e:
    print("Erreur lors de l'injection :", e)
