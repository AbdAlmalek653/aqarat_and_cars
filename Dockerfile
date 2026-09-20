FROM php:8.2-cli

# تثبيت متطلبات SQLite
RUN apt-get update && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

# تحديد مجلد العمل ونسخ الملفات
WORKDIR /app
COPY . /app

# ضبط الصلاحيات لقاعدة البيانات والملفات
RUN chmod -R 777 /app

# المنفذ الافتراضي 80
EXPOSE 80

# تشغيل خادم PHP الداخلي والاستماع للمنفذ المعين من المنصة أو 80 افتراضياً
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-80} -t /app"]