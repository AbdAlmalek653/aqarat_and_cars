FROM php:8.2-cli

# تثبيت SQLite وPDO SQLite
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

# مجلد المشروع
WORKDIR /app

# نسخ ملفات المشروع
COPY . /app

# صلاحيات مناسبة
RUN find /app -type d -exec chmod 755 {} \; \
    && find /app -type f -exec chmod 644 {} \; \
    && if [ -f /app/database/souq.db ]; then chmod 664 /app/database/souq.db; fi

# المنفذ الافتراضي
EXPOSE 80

# استخدام PORT الذي تحدده منصة الاستضافة أو 80 محلياً
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-80} -t /app"]
