FROM alpine:3.24
LABEL authors="csenelle"

RUN apk update \
	&& apk upgrade \
	&& apk add --no-cache \
		nginx \
		curl \
		openssl \
		envsubst \
    && rm -rf /var/cache/apk/*

COPY conf/illumination.template /bin/illumination.template

COPY entrypoint.sh /bin/entrypoint.sh

RUN mkdir -p /etc/nginx/ssl/ \
	&& apk add openssl \
	&& openssl req \
		-x509 \
		-nodes \
		-out /etc/nginx/ssl/certificate.crt \
		-keyout /etc/nginx/ssl/key.key \
		-subj "/C=FR/ST=NA/L=Angouleme/O=42/OU=42/CN=${DOMAIN_NAME}/UID=illumination"

ENTRYPOINT ["/bin/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]