#!/bin/sh

set -e

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "Initializing Database URL"

DB_WEBSITE_PASSWD=$(cat /run/secrets/db_website_pwd)


export DATABASE_URL="postgresql://website_db_admin:${DB_WEBSITE_PASSWD}@postgres:5432/WEBSITE?schema=public"

exec "$@"