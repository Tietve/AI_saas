# Database Backup Strategy

## Overview

This document outlines the comprehensive backup strategy for the My-SaaS-Chat production database infrastructure, including PostgreSQL, MongoDB, Redis, and ClickHouse.

## Table of Contents

1. [Backup Schedule](#backup-schedule)
2. [Backup Types](#backup-types)
3. [Retention Policy](#retention-policy)
4. [Storage Locations](#storage-locations)
5. [Automated Backup Process](#automated-backup-process)
6. [Manual Backup Procedures](#manual-backup-procedures)
7. [Restore Procedures](#restore-procedures)
8. [Monitoring & Alerts](#monitoring--alerts)
9. [Disaster Recovery](#disaster-recovery)
10. [Testing & Validation](#testing--validation)

---

## Backup Schedule

### Automated Backups

| Database | Frequency | Time (UTC) | Retention |
|----------|-----------|------------|-----------|
| PostgreSQL (Full) | Daily | 02:00 | 30 days |
| PostgreSQL (Incremental) | Every 6 hours | 02:00, 08:00, 14:00, 20:00 | 7 days |
| MongoDB | Daily | 03:00 | 30 days |
| Redis (Snapshot) | Every 12 hours | 06:00, 18:00 | 7 days |
| ClickHouse | Daily | 04:00 | 30 days |

### Backup Windows

- **Primary Backup Window:** 02:00 - 05:00 UTC (Lowest traffic period)
- **Secondary Backup Window:** 14:00 - 15:00 UTC (Mid-day backup)

---

## Backup Types

### 1. Full Backups

**PostgreSQL - Full Database Dump**
```bash
# Command executed by backup script
pg_dump -h postgres -U postgres -d saas_db \
  --format=plain \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > backup.sql.gz
```

**MongoDB - Full Archive**
```bash
# MongoDB dump with compression
mongodump --uri="mongodb://..." \
  --archive | gzip > backup.archive.gz
```

**ClickHouse - Full Export**
```bash
# ClickHouse backup
clickhouse-backup create
clickhouse-backup upload latest
```

### 2. Incremental Backups

**PostgreSQL WAL (Write-Ahead Log) Archiving**
- Continuous archiving enabled
- WAL files archived every 5 minutes
- Stored in separate volume

**Configuration:**
```ini
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'
```

### 3. Point-in-Time Recovery (PITR)

- WAL archiving enables PITR capability
- Can restore to any point in time within retention period
- Minimum recovery point: last full backup + WAL files

---

## Retention Policy

### Short-Term Retention (Local Storage)

- **Daily Backups:** 7 days on local volume
- **Incremental Backups:** 7 days
- **WAL Files:** 7 days
- **Redis Snapshots:** 7 days

### Long-Term Retention (S3 Storage)

- **Daily Backups:** 30 days
- **Weekly Backups:** 90 days (every Sunday)
- **Monthly Backups:** 1 year (first day of month)
- **Yearly Backups:** 5 years (January 1st)

### Compliance Retention

For compliance requirements (GDPR, SOC2):
- **Transaction Logs:** 7 years
- **User Data Backups:** 7 years
- **Audit Logs:** 7 years

---

## Storage Locations

### Primary Backup Storage

**Docker Volume (Local)**
```yaml
volumes:
  postgres_backup:
    driver: local
```

Location: `/backups` in backup container
Capacity: 100GB (automatic cleanup)

### Secondary Backup Storage (S3)

**AWS S3 Configuration**
```bash
Bucket: my-saas-chat-backups
Region: us-east-1
Storage Class: S3 Standard-IA (Infrequent Access)
Encryption: AES-256 (Server-side)
Versioning: Enabled
Lifecycle Policies: Enabled
```

**Bucket Structure:**
```
s3://my-saas-chat-backups/
├── postgres/
│   ├── daily/
│   ├── weekly/
│   ├── monthly/
│   └── wal/
├── mongodb/
│   ├── daily/
│   └── weekly/
├── redis/
└── clickhouse/
```

### Tertiary Backup Storage (Optional)

**Google Cloud Storage (GCS) - Disaster Recovery**
- Cross-region replication
- Used for catastrophic failure scenarios
- Daily sync from S3

---

## Automated Backup Process

### Backup Container

The backup service runs as a Docker container:

```yaml
backup:
  image: postgres:15-alpine
  container_name: backup-service
  restart: unless-stopped
  volumes:
    - postgres_backup:/backups
    - ./scripts/backup.sh:/backup.sh:ro
  command: >
    sh -c "while true; do /backup.sh; sleep 86400; done"
```

### Backup Script Flow

1. **Pre-Backup Checks**
   - Verify database connectivity
   - Check available disk space
   - Lock backup process (prevent concurrent runs)

2. **Backup Execution**
   - Create timestamped backup
   - Compress backup file
   - Verify backup integrity

3. **Upload to S3**
   - Upload compressed backup
   - Verify upload success
   - Tag backup with metadata

4. **Cleanup**
   - Remove local backups older than retention period
   - Remove S3 backups based on lifecycle policy
   - Release backup lock

5. **Notification**
   - Send success/failure notification
   - Update monitoring dashboard
   - Log backup statistics

### Cron Schedule

Implemented via Docker container command loop:
```bash
# Daily at 2 AM UTC
0 2 * * * /backup.sh

# Or using container loop
while true; do
  /backup.sh
  sleep 86400  # 24 hours
done
```

---

## Manual Backup Procedures

### PostgreSQL Manual Backup

```bash
# Connect to backup container
docker exec -it backup-service sh

# Run manual backup
/backup.sh

# Or direct pg_dump
PGPASSWORD=password pg_dump \
  -h postgres \
  -U postgres \
  -d saas_db \
  -F c \
  -f /backups/manual_$(date +%Y%m%d_%H%M%S).dump
```

### MongoDB Manual Backup

```bash
# Connect to MongoDB container
docker exec -it mongodb sh

# Create manual backup
mongodump \
  --uri="mongodb://user:pass@localhost:27017/admin" \
  --out=/backups/manual_$(date +%Y%m%d_%H%M%S)
```

### Pre-Deployment Backup

**Always create a backup before major deployments:**

```bash
# Pre-deployment backup script
#!/bin/bash
DEPLOYMENT_VERSION="v1.2.3"
BACKUP_TAG="pre-deployment-${DEPLOYMENT_VERSION}"

# Run backup with custom tag
docker exec backup-service sh -c "BACKUP_TAG=${BACKUP_TAG} /backup.sh"

# Verify backup
aws s3 ls s3://my-saas-chat-backups/postgres/daily/ | grep ${BACKUP_TAG}
```

---

## Restore Procedures

### Full Database Restore

**PostgreSQL Restore from Full Backup**

```bash
# 1. Stop application services
docker-compose stop auth-service chat-service billing-service

# 2. Download backup from S3
aws s3 cp s3://my-saas-chat-backups/postgres/daily/backup.sql.gz .

# 3. Restore database
gunzip -c backup.sql.gz | docker exec -i postgres \
  psql -U postgres -d saas_db

# 4. Verify data integrity
docker exec postgres psql -U postgres -d saas_db -c "SELECT COUNT(*) FROM users;"

# 5. Restart services
docker-compose start auth-service chat-service billing-service
```

### Point-in-Time Recovery (PITR)

**Restore to specific timestamp:**

```bash
# 1. Stop PostgreSQL
docker-compose stop postgres

# 2. Remove current data
docker volume rm postgres_data

# 3. Restore base backup
gunzip -c base_backup.sql.gz | docker exec -i postgres \
  psql -U postgres -d saas_db

# 4. Create recovery configuration
cat > recovery.conf <<EOF
restore_command = 'cp /backups/wal/%f %p'
recovery_target_time = '2024-01-15 14:30:00 UTC'
recovery_target_action = 'promote'
EOF

# 5. Start PostgreSQL in recovery mode
docker-compose start postgres

# 6. Monitor recovery
docker logs -f postgres
```

### MongoDB Restore

```bash
# 1. Download backup
aws s3 cp s3://my-saas-chat-backups/mongodb/daily/backup.archive.gz .

# 2. Restore MongoDB
gunzip -c backup.archive.gz | docker exec -i mongodb \
  mongorestore \
  --uri="mongodb://user:pass@localhost:27017" \
  --archive

# 3. Verify
docker exec mongodb mongosh --eval "db.stats()"
```

### Partial Restore (Single Table)

```bash
# Extract specific table from backup
pg_restore -h postgres -U postgres \
  -d saas_db \
  -t users \
  -c \
  backup.dump
```

---

## Monitoring & Alerts

### Backup Monitoring Metrics

**CloudWatch/Prometheus Metrics:**
- `backup_success_total` - Total successful backups
- `backup_failure_total` - Total failed backups
- `backup_duration_seconds` - Time taken for backup
- `backup_size_bytes` - Size of backup file
- `backup_age_seconds` - Age of latest backup

### Alert Rules

**Prometheus Alert Rules:**

```yaml
groups:
  - name: backup_alerts
    rules:
      - alert: BackupFailed
        expr: backup_failure_total > 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database backup failed"

      - alert: BackupTooOld
        expr: time() - backup_age_seconds > 86400
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Last backup is over 24 hours old"

      - alert: BackupSizeTooLarge
        expr: backup_size_bytes > 10737418240  # 10GB
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Backup size exceeds 10GB"
```

### Notification Channels

- **Email:** ops-team@yourdomain.com
- **Slack:** #alerts-backup channel
- **PagerDuty:** Critical failures (24/7)
- **Dashboard:** Grafana backup dashboard

---

## Disaster Recovery

### Recovery Time Objective (RTO)

**Target RTO:** 2 hours

**Recovery Steps Timeline:**
1. Incident detection: 0-15 minutes
2. Decision to restore: 15-30 minutes
3. Download backup from S3: 30-45 minutes
4. Database restore: 45-90 minutes
5. Application testing: 90-120 minutes

### Recovery Point Objective (RPO)

**Target RPO:** 6 hours

- Daily full backups: Maximum 24 hours data loss
- Incremental backups (6-hour): Maximum 6 hours data loss
- WAL archiving: Near-zero data loss (seconds)

### Disaster Recovery Scenarios

#### Scenario 1: Database Corruption

**Detection:** Application errors, data inconsistencies
**Response:**
1. Stop write operations
2. Assess corruption extent
3. Restore from last known good backup
4. Replay WAL logs if available

#### Scenario 2: Data Center Failure

**Detection:** Complete service unavailability
**Response:**
1. Failover to secondary region
2. Restore from S3 to new infrastructure
3. Update DNS records
4. Verify data integrity

#### Scenario 3: Ransomware Attack

**Detection:** Encrypted/deleted data
**Response:**
1. Isolate affected systems
2. Restore from immutable S3 backup
3. Scan for malware
4. Rebuild infrastructure

#### Scenario 4: Accidental Data Deletion

**Detection:** User reports, monitoring alerts
**Response:**
1. Identify deletion timestamp
2. Perform PITR to time before deletion
3. Extract deleted data
4. Merge with current database

---

## Testing & Validation

### Monthly Backup Testing

**Test Schedule:** First Sunday of each month, 10:00 AM UTC

**Test Procedure:**
```bash
#!/bin/bash
# Monthly backup restoration test

# 1. Create isolated test environment
docker-compose -f docker-compose.test.yml up -d

# 2. Download random backup from last month
RANDOM_BACKUP=$(aws s3 ls s3://my-saas-chat-backups/postgres/daily/ \
  | shuf -n 1 | awk '{print $4}')

# 3. Restore to test database
aws s3 cp "s3://my-saas-chat-backups/postgres/daily/${RANDOM_BACKUP}" - \
  | gunzip | docker exec -i test-postgres psql -U postgres -d test_db

# 4. Run data integrity checks
docker exec test-postgres psql -U postgres -d test_db -f /tests/integrity.sql

# 5. Generate test report
echo "Backup Test Report - $(date)" > test_report.txt
echo "Backup File: ${RANDOM_BACKUP}" >> test_report.txt
echo "Restore Status: SUCCESS" >> test_report.txt

# 6. Cleanup
docker-compose -f docker-compose.test.yml down -v
```

### Validation Checks

**Automated Validation:**
```sql
-- Check row counts
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'chats', COUNT(*) FROM chats
UNION ALL
SELECT 'messages', COUNT(*) FROM messages;

-- Check for orphaned records
SELECT COUNT(*) as orphaned_messages
FROM messages m
LEFT JOIN chats c ON m.chat_id = c.id
WHERE c.id IS NULL;

-- Verify recent data
SELECT MAX(created_at) as latest_record FROM messages;
```

### Performance Validation

- Restore time should not exceed RTO (2 hours)
- Database queries should perform normally post-restore
- All foreign key relationships intact
- No data corruption detected

---

## Security Considerations

### Backup Encryption

**At Rest:**
- S3 Server-Side Encryption (AES-256)
- PostgreSQL backup compressed with gzip

**In Transit:**
- TLS 1.2+ for S3 uploads
- SSH tunnels for database connections

### Access Control

**IAM Policies:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-saas-chat-backups/*"
      ]
    }
  ]
}
```

**Database Access:**
- Backup user has read-only permissions
- Restore operations require elevated privileges
- All access logged in audit trail

### Compliance

**GDPR Compliance:**
- Backups include personal data
- Right to erasure applies to backups
- Data retention policy documented

**SOC 2 Requirements:**
- Backup integrity verification
- Access logging and monitoring
- Regular restoration testing
- Incident response procedures

---

## Best Practices

1. **Always verify backups** - Never trust a backup that hasn't been tested
2. **Encrypt sensitive data** - Use encryption at rest and in transit
3. **Store backups offsite** - Protect against physical disasters
4. **Automate everything** - Reduce human error
5. **Document procedures** - Ensure knowledge transfer
6. **Monitor continuously** - Detect failures immediately
7. **Test regularly** - Practice makes perfect
8. **Version control** - Keep track of backup configurations

---

## Troubleshooting

### Backup Failures

**Problem:** Backup script exits with error
**Solution:**
```bash
# Check logs
docker logs backup-service

# Verify database connection
docker exec backup-service pg_isready -h postgres -U postgres

# Check disk space
docker exec backup-service df -h /backups

# Manual backup attempt
docker exec backup-service /backup.sh
```

### S3 Upload Failures

**Problem:** Cannot upload to S3
**Solution:**
```bash
# Verify AWS credentials
docker exec backup-service aws sts get-caller-identity

# Test S3 access
docker exec backup-service aws s3 ls s3://my-saas-chat-backups/

# Check network connectivity
docker exec backup-service curl -I https://s3.amazonaws.com
```

### Restore Failures

**Problem:** Restore hangs or fails
**Solution:**
```bash
# Check backup file integrity
gunzip -t backup.sql.gz

# Verify PostgreSQL version compatibility
docker exec postgres psql --version

# Try restore with verbose output
gunzip -c backup.sql.gz | docker exec -i postgres \
  psql -U postgres -d saas_db -v ON_ERROR_STOP=1 -e
```

---

## Contact & Support

**Backup Team:**
- Email: backups@yourdomain.com
- Slack: #infrastructure-backups
- On-Call: PagerDuty rotation

**Escalation:**
- Level 1: DevOps Engineer
- Level 2: Senior Infrastructure Engineer
- Level 3: VP of Engineering

---

## Appendix

### Useful Commands

```bash
# List all backups
aws s3 ls s3://my-saas-chat-backups/postgres/daily/ --recursive --human-readable

# Download specific backup
aws s3 cp s3://my-saas-chat-backups/postgres/daily/backup_20240115.sql.gz .

# Calculate total backup size
aws s3 ls s3://my-saas-chat-backups/ --recursive --summarize | grep "Total Size"

# Verify backup age
aws s3api head-object --bucket my-saas-chat-backups --key postgres/daily/latest.sql.gz | jq .LastModified

# Test backup integrity
gunzip -t backup.sql.gz && echo "OK" || echo "CORRUPTED"
```

### Related Documentation

- [Production Deployment Guide](./production-deployment.md)
- [Disaster Recovery Plan](./disaster-recovery.md)
- [Database Administration Guide](../database/admin-guide.md)
- [Security Best Practices](../security/best-practices.md)

---

**Last Updated:** 2025-11-12
**Version:** 1.0
**Owner:** Infrastructure Team
