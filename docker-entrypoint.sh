#!/bin/sh
set -eu

APP_DIR="/var/www/html"
DB_DIR="$APP_DIR/database"
DB_FILE="$DB_DIR/souq.db"
SEED_DB="/opt/seed/database/souq.db"
UPLOAD_DIR="$APP_DIR/uploads/listings"
PORT="${PORT:-80}"

mkdir -p "$DB_DIR" "$UPLOAD_DIR"

# لا تنسخ قاعدة البداية إذا كانت قاعدة Volume موجودة
if [ -f "$DB_FILE" ]; then
    echo "Using existing persistent database: $DB_FILE"
else
    if [ -f "$SEED_DB" ]; then
        echo "Initializing database for the first time..."
        cp "$SEED_DB" "$DB_FILE"
    else
        echo "ERROR: Seed database not found: $SEED_DB"
        exit 1
    fi
fi

# إعطاء PHP صلاحية الكتابة
chown -R www-data:www-data "$DB_DIR" "$APP_DIR/uploads"
chmod 775 "$DB_DIR" "$APP_DIR/uploads" "$UPLOAD_DIR"
chmod 664 "$DB_FILE"

echo "Database path: $DB_FILE"
echo "Starting PHP server on port: $PORT"

exec php -S "0.0.0.0:$PORT" -t "$APP_DIR"
