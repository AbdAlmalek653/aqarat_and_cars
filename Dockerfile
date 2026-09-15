FROM php:8.2-apache

# تثبيت متطلبات ومكتبات SQLite وPDO
RUN apt-get update && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite

# نسخ ملفات المشروع
COPY . /var/www/html/

# ضبط الصلاحيات ليتمكن PHP من القراءة والكتابة في قاعدة بيانات SQLite
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html

EXPOSE 80
