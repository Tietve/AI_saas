#!/bin/bash
# Database Backup Script - FREE with pg_dump
# Run daily via cron: 0 2 * * * /path/to/backup-database.sh

set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "Timestamp: $TIMESTAMP"

# Extract connection details from DATABASE_URL
# Format: postgresql://user:pass@host:port/dbname
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL not set${NC}"
    exit 1
fi

# Perform backup using pg_dump
echo "📦 Creating backup..."
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup successful!${NC}"
    echo "File: $BACKUP_FILE"
    echo "Size: $BACKUP_SIZE"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Delete old backups
echo "🗑️  Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List recent backups
echo "📋 Recent backups:"
ls -lh "$BACKUP_DIR"/db_backup_*.sql.gz | tail -5

echo -e "${GREEN}✅ Backup complete!${NC}"
