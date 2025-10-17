#!/bin/bash
# Setup Backup Cron Job
# This script configures automated daily backups at 2 AM

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"

echo "🔧 Setting up automated database backups..."

# Make scripts executable
chmod +x "$BACKUP_SCRIPT"
chmod +x "$SCRIPT_DIR/restore-database.sh"

echo "✅ Scripts are now executable"

# Create cron job (runs daily at 2 AM)
CRON_JOB="0 2 * * * cd $SCRIPT_DIR && DATABASE_URL=\$DATABASE_URL BACKUP_DIR=$SCRIPT_DIR/../backups ./backup-database.sh >> $SCRIPT_DIR/../logs/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "backup-database.sh"; then
    echo "ℹ️  Cron job already exists"
else
    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added - Daily backups at 2 AM"
fi

# Create necessary directories
mkdir -p "$SCRIPT_DIR/../backups"
mkdir -p "$SCRIPT_DIR/../logs"

echo ""
echo "📋 Backup Configuration:"
echo "  Script: $BACKUP_SCRIPT"
echo "  Schedule: Daily at 2:00 AM"
echo "  Backup Dir: $SCRIPT_DIR/../backups"
echo "  Retention: 30 days"
echo ""
echo "To view cron jobs: crontab -l"
echo "To remove: crontab -e (then delete the line)"
echo ""
echo "✅ Backup automation is ready!"
