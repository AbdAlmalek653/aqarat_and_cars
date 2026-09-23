#!/bin/sh
set -eu

DB_DIR="/var/www/html/database"
DB_FILE="$DB_DIR/souq.db"
SEED_DB="/opt/seed/database/souq.db"

mkdir -p "$DB_DIR"

if [ ! -f "$DB_FILE" ]; then
    if [ -f "$SEED_DB" ]; then
        echo "Initializing persistent SQLite database..."
        cp "$SEED_DB" "$DB_FILE"
    else
        echo "ERROR: Seed database not found at $SEED_DB"
        exit 1
    fi
fi

chown -R www-data:www-data "$DB_DIR"
chmod 775 "$DB_DIR"
chmod 664 "$DB_FILE"

PORT="${PORT:-80}"
exec php -S "0.0.0.0:${PORT}" -t /var/www/html
