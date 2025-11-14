#!/bin/bash
# Database Restore Script
# Usage: ./restore-database.sh <backup_file>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Example: $0 ./backups/db_backup_20250116_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will restore database from backup!"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure? Type 'yes' to continue: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo "🔄 Restoring database from $BACKUP_FILE..."

# Restore using psql
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully!"
else
    echo "❌ Restore failed!"
    exit 1
fi
