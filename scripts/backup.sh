#!/bin/bash
# =============================================================================
# DATABASE BACKUP SCRIPT
# Automated backup with rotation and S3 upload
# =============================================================================

set -e
set -o pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-saas_db}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="postgres_${POSTGRES_DB}_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# S3 Configuration (Optional)
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Logging
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# =============================================================================
# BACKUP POSTGRESQL
# =============================================================================
log "Starting PostgreSQL backup for database: ${POSTGRES_DB}"

if ! PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -U "${POSTGRES_USER}" \
    -d "${POSTGRES_DB}" \
    --format=plain \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip > "${BACKUP_PATH}"; then
    error "PostgreSQL backup failed"
    exit 1
fi

BACKUP_SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
log "PostgreSQL backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})"

# =============================================================================
# UPLOAD TO S3 (Optional)
# =============================================================================
if [ -n "${S3_BUCKET}" ]; then
    log "Uploading backup to S3: s3://${S3_BUCKET}/backups/${BACKUP_FILE}"

    if command -v aws >/dev/null 2>&1; then
        if aws s3 cp "${BACKUP_PATH}" "s3://${S3_BUCKET}/backups/${BACKUP_FILE}" --region "${AWS_REGION}"; then
            log "Backup uploaded to S3 successfully"
        else
            error "Failed to upload backup to S3"
        fi
    else
        error "AWS CLI not installed, skipping S3 upload"
    fi
fi

# =============================================================================
# CLEANUP OLD BACKUPS
# =============================================================================
log "Cleaning up backups older than ${RETENTION_DAYS} days"

find "${BACKUP_DIR}" -name "postgres_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Cleanup old S3 backups
if [ -n "${S3_BUCKET}" ] && command -v aws >/dev/null 2>&1; then
    CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
    log "Cleaning up S3 backups older than ${CUTOFF_DATE}"

    aws s3 ls "s3://${S3_BUCKET}/backups/" --region "${AWS_REGION}" | while read -r line; do
        BACKUP_DATE=$(echo "$line" | awk '{print $1}')
        BACKUP_NAME=$(echo "$line" | awk '{print $4}')

        if [[ "${BACKUP_DATE}" < "${CUTOFF_DATE}" ]]; then
            log "Deleting old S3 backup: ${BACKUP_NAME}"
            aws s3 rm "s3://${S3_BUCKET}/backups/${BACKUP_NAME}" --region "${AWS_REGION}"
        fi
    done
fi

# =============================================================================
# BACKUP VERIFICATION
# =============================================================================
log "Verifying backup integrity"

if gunzip -t "${BACKUP_PATH}"; then
    log "Backup verification successful"
else
    error "Backup verification failed - file may be corrupted"
    exit 1
fi

# =============================================================================
# BACKUP MONGODB (Optional)
# =============================================================================
if [ -n "${MONGODB_URL}" ]; then
    MONGO_BACKUP_FILE="mongodb_${TIMESTAMP}.archive.gz"
    MONGO_BACKUP_PATH="${BACKUP_DIR}/${MONGO_BACKUP_FILE}"

    log "Starting MongoDB backup"

    if mongodump --uri="${MONGODB_URL}" --archive | gzip > "${MONGO_BACKUP_PATH}"; then
        MONGO_SIZE=$(du -h "${MONGO_BACKUP_PATH}" | cut -f1)
        log "MongoDB backup completed: ${MONGO_BACKUP_FILE} (${MONGO_SIZE})"

        # Upload to S3
        if [ -n "${S3_BUCKET}" ] && command -v aws >/dev/null 2>&1; then
            aws s3 cp "${MONGO_BACKUP_PATH}" "s3://${S3_BUCKET}/backups/${MONGO_BACKUP_FILE}" --region "${AWS_REGION}"
        fi
    else
        error "MongoDB backup failed"
    fi
fi

# =============================================================================
# SUMMARY
# =============================================================================
TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -name "*.sql.gz" -o -name "*.archive.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)

log "Backup summary:"
log "  - Total backups: ${TOTAL_BACKUPS}"
log "  - Total size: ${TOTAL_SIZE}"
log "  - Retention period: ${RETENTION_DAYS} days"
log "Backup process completed successfully"

exit 0
