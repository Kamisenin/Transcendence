FROM alpine:3.24.1
LABEL authors="csenelle"

RUN apk update \
	&& apk upgrade \
	&& apk add --no-cache \
		nginx \
		curl \
		openssl \
		envsubst \
    && rm -rf /var/cache/apk/*

COPY conf/server.template /bin/server.template

COPY entrypoint.sh /bin/entrypoint.sh

RUN chmod 777 /bin/entrypoint.sh \
	&& chmod 777 /bin/server.template

RUN mkdir -p /etc/nginx/ssl/ \
	&& apk add openssl \
	&& openssl req \
		-x509 \
		-nodes \
		-out /etc/nginx/ssl/42chan.crt \
		-keyout /etc/nginx/ssl/42chan.key \
		-subj "/C=FR/ST=NA/L=Angouleme/O=42/OU=42/CN=42chan.fr/UID=42chan"

ENTRYPOINT ["/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]