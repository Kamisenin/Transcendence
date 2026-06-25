#!/bin/sh

set -e

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "Initializing Databases URL"

DB_WEBSITE_PASSWD=$(cat /run/secrets/db_website_passwd)
DB_USERS_PASSWD=$(cat /run/secrets/db_users_passwd)


export WEBSITE_DATABASE_URL="postgresql://website_db_admin:${DB_WEBSITE_PASSWD}@postgres:5432/WEBSITE?schema=public"
export USERS_DATABASE_URL="postgresql://user_db_admin:${DB_USERS_PASSWD}@postgres:5432/USERS?schema=public"

exec "$@"