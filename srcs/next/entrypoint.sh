#!/bin/sh

set -e

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "Initializing Database URL"

DB_WEBSITE_PASSWD=$(cat /run/secrets/db_website_pwd)

export DATABASE_URL="postgresql://website_db_admin:${DB_WEBSITE_PASSWD}@postgres:5432/WEBSITE?schema=public"
export GMAIL_USER=$(cat /run/secrets/gmail_user)
export GMAIL_APP_PASSWORD=$(cat /run/secrets/gmail_app_pwd)
export SEARCH_ENGINE_URL="http://search-engine:8000"

exec "$@"