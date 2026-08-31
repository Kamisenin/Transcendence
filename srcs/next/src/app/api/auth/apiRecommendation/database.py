import os
import psycopg

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://website_db_admin:pass@localhost:5432/WEBSITE"
)

def get_connection():
    return psycopg.connect(DATABASE_URL)

