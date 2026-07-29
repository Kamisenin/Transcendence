#!/bin/sh

set -e

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "Generating Postgre configuration..."

check_var() {
    local var_name="$1"
    local var_value="$2"

    if [ -z "$var_value" ]; then
        log "ERROR: Environment variable $var_name has not been set or is empty"
        exit 1
    fi
}


DB_ROOT_PASSWD=$(cat /run/secrets/db_root_pwd)
DB_WEBSITE_PASSWD=$(cat /run/secrets/db_website_pwd)

check_var "DB_ROOT_PASSWD" "$DB_ROOT_PASSWD"
check_var "DB_WEBSITE_PASSWD" "$DB_WEBSITE_PASSWD"


PGDATA="${PGDATA:-/var/lib/postgresql/data}"
log "Initializing Website Database..."

psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL

    CREATE DATABASE "WEBSITE" ENCODING 'UTF8' TEMPLATE template0;
    CREATE USER website_db_admin WITH PASSWORD '${DB_WEBSITE_PASSWD}';
    GRANT ALL PRIVILEGES ON DATABASE "WEBSITE" TO website_db_admin;
    ALTER USER website_db_admin WITH CREATEDB;
    CREATE USER health WITH PASSWORD 'health';
EOSQL

psql -v ON_ERROR_STOP=1 --username "postgres" --dbname "WEBSITE" <<-EOSQL
    ALTER SCHEMA public OWNER TO website_db_admin;
    GRANT ALL PRIVILEGES ON SCHEMA public TO website_db_admin;
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EOSQL

log "Initialization done..."
log "Starting PostgreSQL normally..."