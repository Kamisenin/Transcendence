#!/bin/sh

set -e

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "Generating MariaDB configuration..."

check_var() {
    local var_name="$1"
    local var_value="$2"

    if [ -z "$var_value" ]; then
        log "ERROR: Environment variable $var_name has not been set or is empty"
        exit 1
    fi
}

check_var "DB_ROOT_PASSWD" "$DB_ROOT_PASSWD"

check_var "DB_NAME" "$WP_DB_NAME"
check_var "DB_USER" "$WP_DB_USER"
check_var "DB_USER_PASSWD" "$WP_DB_USER_PASSWD"


if [ -f "/var/lib/mysql/mysql/init_manifesto" ]; then
	log "Database already exist, skipping"
else
    log "Initializing Wordpress Database..."

    mariadbd -u mysql --bootstrap << EOF
        FLUSH PRIVILEGES;
        ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_ROOT_PASSWD';
        FLUSH PRIVILEGES;

        CREATE DATABASE IF NOT EXISTS \`${WP_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        CREATE USER IF NOT EXISTS '${WP_DB_USER}'@'%' IDENTIFIED BY '${WP_DB_USER_PASSWD}';
        GRANT ALL PRIVILEGES ON \`${WP_DB_NAME}\`.* TO '${WP_DB_USER}'@'%';

        CREATE USER 'health'@'%' IDENTIFIED BY 'health';

        FLUSH PRIVILEGES;
EOF
    log "Initialization done..."
    touch /var/lib/mysql/mysql/init_manifesto
fi

log "Starting MariaDB normally..."
exec "$@"