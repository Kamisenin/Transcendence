import psycopg

DATABASE_URL = "postgresql://website_db_admin:pass@localhost:5432/WEBSITE"

try:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            print("=== STATISTIQUES DES TAGS (tag_statistics) ===")
            cur.execute("SELECT tag_id, document_frequency, idf FROM tag_statistics;")
            stats = cur.fetchall()
            for s in stats:
                print(f"Tag ID: {s[0]} | Doc Freq: {s[1]} | IDF: {s[2]}")

            print("\n=== INTÉRÊTS UTILISATEURS (user_tag_interests) ===")
            cur.execute("""
                SELECT u.username, t.name, uti.weight 
                FROM user_tag_interests uti
                JOIN users u ON uti.user_id = u.user_id
                JOIN tags t ON uti.tag_id = t.id;
            """)
            interests = cur.fetchall()
            for i in interests:
                print(f"User: {i[0]:<10} | Tag: {i[1]:<10} | Poids: {i[2]}")

except Exception as e:
    print("Erreur :", e)
