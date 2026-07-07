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


DB_ROOT_PASSWD=$(cat /run/secrets/db_root_pwd)
DB_USERS_PASSWD=$(cat /run/secrets/db_users_pwd)
DB_WEBSITE_PASSWD=$(cat /run/secrets/db_website_pwd)

check_var "DB_ROOT_PASSWD" "$DB_ROOT_PASSWD"
check_var "DB_USERS_PASSWD" "$DB_USERS_PASSWD"
check_var "DB_WEBSITE_PASSWD" "DB_WEBSITE_PASSWD"


if [ -f "/var/lib/mysql/mysql/init_manifesto" ]; then
	log "Database already exist, skipping"
else
    log "Initializing Wordpress Database..."

    mariadbd -u mysql --bootstrap << EOF
        FLUSH PRIVILEGES;
        ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_ROOT_PASSWD';
        FLUSH PRIVILEGES;

        CREATE DATABASE IF NOT EXISTS \`USERS\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        CREATE USER IF NOT EXISTS 'user_db_admin' @'%' IDENTIFIED BY '${DB_USERS_PASSWD}';
        GRANT ALL PRIVILEGES ON \`USERS\`.* TO 'user_db_admin'@'%';

        CREATE DATABASE IF NOT EXISTS \`WEBSITE\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        CREATE USER IF NOT EXISTS 'website_db_admin' @'%' IDENTIFIED BY '${DB_WEBSITE_PASSWD}';
        GRANT ALL PRIVILEGES ON \`WEBSITE\`.* TO 'website_db_admin'@'%';

        CREATE USER 'health'@'%' IDENTIFIED BY 'health';

        FLUSH PRIVILEGES;
EOF
    log "Initialization done..."
    touch /var/lib/mysql/mysql/init_manifesto
fi

log "Starting MariaDB normally..."
exec "$@"