FROM php:8.2-cli


RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . /var/www/html/

# نسخ نسخة ابتدائية خارج مجلد الـ Volume
RUN mkdir -p /opt/seed/database \
    /var/www/html/database \
    /var/www/html/uploads/listings \
    \
    && if [ -f /var/www/html/database/souq.db ]; then \
         cp /var/www/html/database/souq.db /opt/seed/database/souq.db; \
       fi \
    \
    && cp /var/www/html/docker-entrypoint.sh \
       /usr/local/bin/docker-entrypoint.sh \
    \
    && chmod +x /usr/local/bin/docker-entrypoint.sh \
    \
    && chown -R www-data:www-data /var/www/html \
    \
    && find /var/www/html -type d -exec chmod 755 {} \; \
    && find /var/www/html -type f -exec chmod 644 {} \; \
    \
    && chmod 775 /var/www/html/database \
    /var/www/html/uploads \
    /var/www/html/uploads/listings

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
