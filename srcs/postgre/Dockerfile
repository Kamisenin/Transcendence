FROM alpine:3.24.1
LABEL authors="csenelle"

RUN mkdir -p /run/mysqld

RUN apk add --no-cache \
    mariadb \
    mariadb-client

COPY "entrypoint.sh" "/bin/"

RUN mariadb-install-db --basedir=/usr --user=mysql --datadir=/var/lib/mysql \
    && chown -R mysql:mysql /run/mysqld /var/lib/mysql \
    && chmod +x /bin/entrypoint.sh

COPY "conf/mariadb-server.cnf" "/etc/my.cnf.d/"

EXPOSE 3306

ENTRYPOINT ["/bin/entrypoint.sh"]
CMD ["rm", "-f", "/bin/entrypoint.sh"]
CMD ["mariadbd"]