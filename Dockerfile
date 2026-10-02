FROM php:8.2-apache

# تثبيت امتدادات PHP المطلوبة + إضافات Apache
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libsqlite3-dev \
        libpng-dev \
        libjpeg-dev \
        libwebp-dev \
        libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_sqlite gd \
    && a2enmod rewrite headers expires \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY . /var/www/html/

# نسخ نسخة ابتدائية خارج مجلد الـ Volume
RUN mkdir -p /opt/seed/database \
    /var/www/html/database \
    /var/www/html/uploads/listings \
    /var/www/html/api/cache/images \
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
    /var/www/html/uploads/listings \
    /var/www/html/api/cache/images

# ✅ إعدادات Apache للأداء
RUN echo '<Directory /var/www/html>\n\
    Options -Indexes +FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n\
\n\
# ضغط الملفات الثابتة\n\
<IfModule mod_deflate.c>\n\
    AddOutputFilterByType DEFLATE text/html text/css text/plain text/xml application/javascript application/json image/svg+xml\n\
</IfModule>\n\
\n\
# كاش الملفات الثابتة في المتصفح\n\
<IfModule mod_expires.c>\n\
    ExpiresActive On\n\
    ExpiresByType text/css "access plus 1 year"\n\
    ExpiresByType application/javascript "access plus 1 year"\n\
    ExpiresByType image/png "access plus 1 year"\n\
    ExpiresByType image/jpeg "access plus 1 year"\n\
    ExpiresByType image/webp "access plus 1 year"\n\
    ExpiresByType image/svg+xml "access plus 1 year"\n\
    ExpiresByType font/woff2 "access plus 1 year"\n\
</IfModule>\n\
\n\
ServerTokens Prod\n\
ServerSignature Off\n' > /etc/apache2/conf-available/souq.conf \
    && a2enconf souq

# Apache يشتغل على المنفذ 80
EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]