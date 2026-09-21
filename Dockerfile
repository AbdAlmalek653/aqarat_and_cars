FROM php:8.2-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && (a2dismod mpm_event mpm_worker mpm_prefork || true) \
    && a2enmod mpm_prefork \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . /var/www/html/

# نسخ نسخة ابتدائية خارج مجلد الـ Volume
RUN mkdir -p /opt/seed/database \
    && if [ -f /var/www/html/database/souq.db ]; then \
         cp /var/www/html/database/souq.db /opt/seed/database/souq.db; \
       fi \
    && cp /var/www/html/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
