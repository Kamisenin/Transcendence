import math
from database import get_connection

# ============================================================
# USER PROFILE
# ============================================================

def load_user_profile(cursor, user_id):
    cursor.execute(
        """
        SELECT
            tag_id,
            weight
        FROM user_tag_interests
        WHERE user_id = %s
        """,
        (user_id,)
    )

    rows = cursor.fetchall()
    vector = {}
    for tag_id, weight in rows:
        vector[tag_id] = weight

    return vector


# ============================================================
# PAGE VECTORS
# ============================================================

def load_page_vectors(cursor):
    # 💡 LEFT JOIN + COALESCE(ts.idf, 1.0) pour accepter les nouveaux tags non calculés
    cursor.execute(
        """
        SELECT
            tp.page_id,
            tp.tag_id,
            COALESCE(ts.idf, 1.0) AS idf
        FROM tag_pages tp
        LEFT JOIN tag_statistics ts
            ON ts.tag_id = tp.tag_id
        """
    )

    rows = cursor.fetchall()
    pages = {}

    for page_id, tag_id, idf in rows:
        if page_id not in pages:
            pages[page_id] = {}
        pages[page_id][tag_id] = float(idf)

    return pages


# ============================================================
# VECTOR NORM
# ============================================================

def calculate_norm(vector):
    total = 0.0
    for value in vector.values():
        total += value * value
    return math.sqrt(total)


# ============================================================
# COSINE SIMILARITY
# ============================================================

def cosine_similarity(user_vector, page_vector):
    produit = 0.0

    for tag_id in user_vector:
        if tag_id in page_vector:
            produit += (
                user_vector[tag_id]
                * page_vector[tag_id]
            )

    user_norm = calculate_norm(user_vector)
    page_norm = calculate_norm(page_vector)

    if user_norm == 0 or page_norm == 0:
        return 0.0

    return produit / (user_norm * page_norm)


# ============================================================
# RECOMMENDATIONS
# ============================================================

def get_recommendations(user_id, limit=5):
    with get_connection() as conn:
        with conn.cursor() as cursor:

            user_vector = load_user_profile(cursor, user_id)

            if not user_vector:
                return []

            pages = load_page_vectors(cursor)
            results = []

            for page_id, page_vector in pages.items():
                score = cosine_similarity(user_vector, page_vector)
                results.append(
                    {
                        "page_id": page_id,
                        "score": round(score, 4)
                    }
                )

            results.sort(
                key=lambda result: result["score"],
                reverse=True
            )

            return results[:limit]