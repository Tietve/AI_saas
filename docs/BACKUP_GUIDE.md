# Database Backup & Restore Guide

## Overview
This project uses **FREE** automated backups with `pg_dump` - no paid services required!

**Cost**: $0/month (uses pg_dump + local/cloud storage)

## Features
- ✅ Daily automated backups at 2 AM
- ✅ 30-day retention (configurable)
- ✅ Gzip compression
- ✅ Simple restore process
- ✅ Works with Neon PostgreSQL FREE tier

---

## Setup Automated Backups

### 1. Initial Setup (One-time)
```bash
cd scripts
chmod +x setup-backup-cron.sh
./setup-backup-cron.sh
```

This will:
- Make backup scripts executable
- Create cron job for daily backups at 2 AM
- Create backup directories

### 2. Manual Backup (Optional)
```bash
cd scripts
DATABASE_URL="your_database_url" ./backup-database.sh
```

**Output**: `backups/db_backup_20250116_020000.sql.gz`

---

## Restore Database

### 1. List Available Backups
```bash
ls -lh backups/
```

### 2. Restore from Backup
```bash
cd scripts
./restore-database.sh ../backups/db_backup_20250116_020000.sql.gz
```

⚠️ **WARNING**: This will restore the database. You'll be asked to confirm.

---

## Configuration

### Change Backup Schedule
Edit cron job:
```bash
crontab -e
```

Default: `0 2 * * *` (daily at 2 AM)

### Change Retention Period
Set environment variable before running:
```bash
RETENTION_DAYS=60 ./backup-database.sh  # Keep 60 days
```

### Change Backup Directory
```bash
BACKUP_DIR=/path/to/backups ./backup-database.sh
```

---

## Azure Deployment (Production)

For Azure App Service, use Azure's built-in backup or upload to Azure Blob Storage:

### Option 1: Manual Scheduled Task (Free)
Add to Azure App Service deployment script:
```bash
# In .azure/deploy.sh
0 2 * * * /home/site/wwwroot/scripts/backup-database.sh
```

### Option 2: Upload to Azure Blob (Recommended for Production)
Modify `backup-database.sh` to upload to Azure Blob Storage:
```bash
# After backup creation
az storage blob upload \
  --account-name yourstorage \
  --container-name backups \
  --file "$BACKUP_FILE" \
  --name "$(basename $BACKUP_FILE)"
```

**Cost**: Azure Blob Storage ~$0.02/GB/month (LRS)

---

## Monitoring

### Check Backup Logs
```bash
tail -f logs/backup.log
```

### Verify Backups
```bash
# Check backup file integrity
gunzip -t backups/db_backup_20250116_020000.sql.gz

# Preview backup contents
gunzip -c backups/db_backup_20250116_020000.sql.gz | head -50
```

---

## Troubleshooting

### Error: "DATABASE_URL not set"
**Fix**: Export DATABASE_URL before running:
```bash
export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
./backup-database.sh
```

### Error: "pg_dump: command not found"
**Fix**: Install PostgreSQL client:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows (with WSL)
sudo apt-get install postgresql-client
```

### Backup file too large
**Solution**: Backups are already gzipped. For even smaller files:
```bash
pg_dump "$DATABASE_URL" | gzip -9 > backup.sql.gz  # Maximum compression
```

---

## Best Practices

1. **Test restores regularly** - Verify backups work before you need them
2. **Store backups off-site** - Upload to cloud storage (Azure Blob, S3, etc.)
3. **Monitor backup size** - Sudden size changes may indicate issues
4. **Keep multiple retention windows** - Daily (30d), Weekly (12w), Monthly (12m)
5. **Secure backup files** - Contain sensitive data, encrypt if storing publicly

---

## Backup Strategy for Production

For 1000+ users, recommended approach:

### Daily Backups
- Automated via cron at 2 AM (low traffic time)
- Retention: 30 days
- Storage: Local + Azure Blob

### Weekly Backups
- Every Sunday at 3 AM
- Retention: 12 weeks
- Storage: Azure Blob (cold tier for cost savings)

### Monthly Backups
- First day of month at 4 AM
- Retention: 12 months
- Storage: Azure Blob (archive tier)

**Total Cost**: ~$5-10/month for 1000+ user database

---

## Emergency Recovery

If production database fails:

1. **Identify latest good backup**:
   ```bash
   ls -lt backups/ | head -5
   ```

2. **Test restore on staging first** (if available):
   ```bash
   DATABASE_URL="$STAGING_URL" ./restore-database.sh backup.sql.gz
   ```

3. **Restore production**:
   ```bash
   DATABASE_URL="$PRODUCTION_URL" ./restore-database.sh backup.sql.gz
   ```

4. **Verify data integrity**:
   ```bash
   # Run smoke tests
   npm run test:smoke
   ```

---

## FAQ

**Q: Can I use this with Neon FREE tier?**
A: Yes! pg_dump works perfectly with Neon's free tier.

**Q: How long does backup take?**
A: Depends on database size. For 1000 users: ~30 seconds to 2 minutes.

**Q: What if cron doesn't work on Azure?**
A: Use Azure Functions with Timer Trigger (FREE tier: 1M executions/month).

**Q: Can I backup to Google Drive?**
A: Yes! Use `rclone` to sync backups to Google Drive (15GB free).

---

## Related Files
- `scripts/backup-database.sh` - Main backup script
- `scripts/restore-database.sh` - Restore script
- `scripts/setup-backup-cron.sh` - Cron setup
- `backups/` - Backup storage directory
- `logs/backup.log` - Backup execution logs
