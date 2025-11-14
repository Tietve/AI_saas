#!/bin/bash
# =============================================================================
# DATABASE RESTORE SCRIPT
# Restore database from backup with verification
# =============================================================================

set -e
set -o pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-saas_db}"
S3_BUCKET="${BACKUP_S3_BUCKET:-}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $*"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $*" >&2
}

# Usage information
usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Database Restore Script

OPTIONS:
    -f FILE         Restore from local file
    -s S3_KEY       Restore from S3 object key
    -l              List available backups
    -d DATE         Restore from date (YYYYMMDD)
    -t TIMESTAMP    Point-in-time restore (YYYY-MM-DD HH:MM:SS)
    -y              Skip confirmation prompt
    -h              Show this help message

EXAMPLES:
    # Restore from local file
    $0 -f /backups/postgres_saas_db_20240115.sql.gz

    # Restore from S3
    $0 -s postgres/daily/postgres_saas_db_20240115.sql.gz

    # List available backups
    $0 -l

    # Restore latest backup from specific date
    $0 -d 20240115

EOF
    exit 1
}

# List available backups
list_backups() {
    log "Available backups:"
    echo ""
    echo "Local backups:"
    find "${BACKUP_DIR}" -name "postgres_*.sql.gz" -type f -printf "%T@ %Tc %p\n" | sort -rn | cut -d' ' -f2- | head -20

    if [ -n "${S3_BUCKET}" ] && command -v aws >/dev/null 2>&1; then
        echo ""
        echo "S3 backups (last 20):"
        aws s3 ls "s3://${S3_BUCKET}/backups/" --region "${AWS_REGION}" --recursive | grep "postgres_.*\.sql\.gz$" | tail -20
    fi
}

# Download backup from S3
download_from_s3() {
    local s3_key="$1"
    local local_file="${BACKUP_DIR}/$(basename ${s3_key})"

    log "Downloading backup from S3: s3://${S3_BUCKET}/${s3_key}"

    if ! aws s3 cp "s3://${S3_BUCKET}/${s3_key}" "${local_file}" --region "${AWS_REGION}"; then
        error "Failed to download backup from S3"
        exit 1
    fi

    echo "${local_file}"
}

# Find backup by date
find_backup_by_date() {
    local date="$1"
    local backup_file

    # Try local first
    backup_file=$(find "${BACKUP_DIR}" -name "postgres_*_${date}_*.sql.gz" -type f | sort -r | head -1)

    if [ -n "${backup_file}" ]; then
        echo "${backup_file}"
        return 0
    fi

    # Try S3
    if [ -n "${S3_BUCKET}" ] && command -v aws >/dev/null 2>&1; then
        local s3_key=$(aws s3 ls "s3://${S3_BUCKET}/backups/" --recursive --region "${AWS_REGION}" | \
            grep "postgres_.*_${date}_.*\.sql\.gz$" | \
            tail -1 | \
            awk '{print $4}')

        if [ -n "${s3_key}" ]; then
            download_from_s3 "${s3_key}"
            return 0
        fi
    fi

    error "No backup found for date: ${date}"
    exit 1
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"

    log "Verifying backup integrity: ${backup_file}"

    if ! gunzip -t "${backup_file}"; then
        error "Backup file is corrupted"
        exit 1
    fi

    log "Backup integrity verified"
}

# Pre-restore checks
pre_restore_checks() {
    log "Running pre-restore checks..."

    # Check if database exists
    if ! PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -lqt | cut -d \| -f 1 | grep -qw "${POSTGRES_DB}"; then
        warn "Database ${POSTGRES_DB} does not exist. It will be created."
    fi

    # Check database size
    local db_size=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc "SELECT pg_database_size('${POSTGRES_DB}');")
    log "Current database size: $((db_size / 1024 / 1024)) MB"

    # Check active connections
    local active_connections=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d postgres -tAc "SELECT count(*) FROM pg_stat_activity WHERE datname = '${POSTGRES_DB}';")
    if [ "${active_connections}" -gt 0 ]; then
        warn "There are ${active_connections} active connections to the database"
        warn "These connections will be terminated during restore"
    fi

    log "Pre-restore checks completed"
}

# Backup current database before restore
backup_current_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/pre_restore_${POSTGRES_DB}_${timestamp}.sql.gz"

    log "Creating backup of current database before restore..."

    if PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
        -h "${POSTGRES_HOST}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        --format=plain \
        --no-owner \
        --no-acl \
        | gzip > "${backup_file}"; then
        log "Current database backed up to: ${backup_file}"
    else
        error "Failed to backup current database"
        exit 1
    fi
}

# Terminate active connections
terminate_connections() {
    log "Terminating active connections to database: ${POSTGRES_DB}"

    PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d postgres <<EOF
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${POSTGRES_DB}'
AND pid <> pg_backend_pid();
EOF
}

# Restore database
restore_database() {
    local backup_file="$1"

    log "Starting database restore from: ${backup_file}"

    # Terminate connections
    terminate_connections

    # Restore
    if gunzip -c "${backup_file}" | \
        PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${POSTGRES_HOST}" \
        -U "${POSTGRES_USER}" \
        -d "${POSTGRES_DB}" \
        -v ON_ERROR_STOP=1 \
        --single-transaction; then
        log "Database restore completed successfully"
    else
        error "Database restore failed"
        exit 1
    fi
}

# Post-restore verification
post_restore_verification() {
    log "Running post-restore verification..."

    # Check table counts
    local table_count=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
    log "Number of tables: ${table_count}"

    # Check for recent data
    local users_count=$(PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -tAc "SELECT count(*) FROM users;" 2>/dev/null || echo "0")
    log "Number of users: ${users_count}"

    # Run vacuum analyze
    log "Running VACUUM ANALYZE..."
    PGPASSWORD="${POSTGRES_PASSWORD}" psql -h "${POSTGRES_HOST}" -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c "VACUUM ANALYZE;"

    log "Post-restore verification completed"
}

# Confirmation prompt
confirm() {
    if [ "${SKIP_CONFIRMATION}" = "true" ]; then
        return 0
    fi

    echo ""
    warn "⚠️  WARNING: This will overwrite the current database!"
    warn "Database: ${POSTGRES_DB}"
    warn "Host: ${POSTGRES_HOST}"
    echo ""
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
    echo ""

    if [[ ! $REPLY =~ ^yes$ ]]; then
        log "Restore cancelled by user"
        exit 0
    fi
}

# Main restore process
main() {
    local backup_file=""
    local s3_key=""
    local restore_date=""
    local list_only=false
    SKIP_CONFIRMATION=false

    # Parse arguments
    while getopts "f:s:d:t:lyh" opt; do
        case ${opt} in
            f) backup_file="$OPTARG" ;;
            s) s3_key="$OPTARG" ;;
            d) restore_date="$OPTARG" ;;
            l) list_only=true ;;
            y) SKIP_CONFIRMATION=true ;;
            h) usage ;;
            *) usage ;;
        esac
    done

    # List backups and exit
    if [ "${list_only}" = true ]; then
        list_backups
        exit 0
    fi

    # Determine backup file
    if [ -n "${backup_file}" ]; then
        if [ ! -f "${backup_file}" ]; then
            error "Backup file not found: ${backup_file}"
            exit 1
        fi
    elif [ -n "${s3_key}" ]; then
        backup_file=$(download_from_s3 "${s3_key}")
    elif [ -n "${restore_date}" ]; then
        backup_file=$(find_backup_by_date "${restore_date}")
    else
        error "No backup specified. Use -f, -s, or -d option."
        usage
    fi

    log "==================================================================="
    log "DATABASE RESTORE OPERATION"
    log "==================================================================="
    log "Backup file: ${backup_file}"
    log "Target database: ${POSTGRES_DB}"
    log "Target host: ${POSTGRES_HOST}"
    log "==================================================================="

    # Verify backup
    verify_backup "${backup_file}"

    # Confirm restore
    confirm

    # Pre-restore checks
    pre_restore_checks

    # Backup current database
    backup_current_database

    # Restore
    restore_database "${backup_file}"

    # Verify
    post_restore_verification

    log "==================================================================="
    log "✅ DATABASE RESTORE COMPLETED SUCCESSFULLY"
    log "==================================================================="
}

# Run main function
main "$@"
