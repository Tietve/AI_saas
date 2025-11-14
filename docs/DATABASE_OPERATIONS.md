# Database Operations Guide

Complete guide for database management, backups, and migrations.

## Quick Reference

```bash
# Backup
npm run db:backup                    # Create backup
npm run db:backup:auto              # Automated daily backup

# Restore
npm run db:restore backup.sql       # Restore from file

# Migrations
npm run db:migrate                  # Dev migrations
npm run db:migrate:prod             # Production migrations
npm run db:generate                 # Generate Prisma client

# Utilities
npm run db:studio                   # Open Prisma Studio
npm run db:reset                    # Reset database (DEV ONLY!)
```

## Backup Procedures

### Manual Backup

```bash
# Docker Compose
docker compose exec db pg_dump -U postgres ai_saas > backup_$(date +%Y%m%d_%H%M%S).sql

# Kubernetes
kubectl exec -n ai-saas-prod deployment/ai-saas-web -- \
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Direct PostgreSQL
pg_dump postgresql://user:pass@host:5432/ai_saas > backup.sql
```

### Automated Backups (Cron)

Add to crontab:

```cron
# Daily backup at 2 AM
0 2 * * * cd /opt/ai-saas-app && docker compose exec -T db pg_dump -U postgres ai_saas | gzip > /backups/ai_saas_$(date +\%Y\%m\%d).sql.gz

# Keep last 7 days
0 3 * * * find /backups -name "ai_saas_*.sql.gz" -mtime +7 -delete
```

### Backup to S3 (Recommended for Production)

```bash
#!/bin/bash
# backup-to-s3.sh

BACKUP_FILE="ai_saas_$(date +%Y%m%d_%H%M%S).sql.gz"
pg_dump $DATABASE_URL | gzip > /tmp/$BACKUP_FILE
aws s3 cp /tmp/$BACKUP_FILE s3://your-bucket/backups/$BACKUP_FILE
rm /tmp/$BACKUP_FILE
echo "Backup completed: $BACKUP_FILE"
```

## Restore Procedures

### Full Restore

```bash
# 1. Stop application
docker compose stop web

# 2. Drop and recreate database
docker compose exec db dropdb -U postgres ai_saas
docker compose exec db createdb -U postgres ai_saas

# 3. Restore from backup
docker compose exec -T db psql -U postgres ai_saas < backup.sql

# 4. Restart application
docker compose start web
```

### Point-in-Time Recovery (if using managed PostgreSQL)

Check your provider's documentation:
- **Supabase**: Dashboard → Database → Backups
- **AWS RDS**: Use automated backups + transaction logs
- **Neon**: Branch from specific timestamp

## Migration Management

### Development Workflow

```bash
# 1. Make schema changes in prisma/schema.prisma

# 2. Create migration
npm run db:migrate -- --name add_user_preferences

# 3. Verify migration SQL
cat prisma/migrations/<timestamp>_add_user_preferences/migration.sql

# 4. Test migration
npm run db:migrate
```

### Production Deployment

```bash
# 1. Backup before migration
pg_dump $DATABASE_URL > pre_migration_backup.sql

# 2. Run migration
npm run db:migrate:prod

# 3. Verify migration
npx prisma db push --accept-data-loss --skip-generate

# 4. If issues, rollback
psql $DATABASE_URL < pre_migration_backup.sql
```

### Migration Best Practices

✅ **DO:**
- Backup before every production migration
- Test migrations in staging first
- Use transactions where possible
- Keep migrations small and focused
- Document breaking changes

❌ **DON'T:**
- Run migrations during peak traffic
- Deploy code and schema changes separately
- Use `db:push` in production
- Delete old migrations from version control

## Connection Pooling

### Optimal Settings

```env
# .env.production
DATABASE_URL="postgresql://user:pass@host:5432/db?
  schema=public&
  connection_limit=10&
  pool_timeout=20&
  connect_timeout=10"
```

**Recommended Limits:**
- Small apps (1 instance): `connection_limit=10`
- Medium apps (3 instances): `connection_limit=5` per instance
- Large apps (10+ instances): Use PgBouncer

### Using PgBouncer

```yaml
# docker-compose.prod.yml
pgbouncer:
  image: pgbouncer/pgbouncer:latest
  environment:
    DATABASES_HOST: db
    DATABASES_PORT: 5432
    DATABASES_USER: postgres
    DATABASES_PASSWORD: ${DB_PASSWORD}
    DATABASES_DBNAME: ai_saas
    POOL_MODE: transaction
    MAX_CLIENT_CONN: 1000
    DEFAULT_POOL_SIZE: 20
  ports:
    - "6432:6432"
```

Update DATABASE_URL:
```env
DATABASE_URL="postgresql://user:pass@pgbouncer:6432/ai_saas"
```

## Performance Monitoring

### Check Connection Usage

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Connections by state
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;

-- Long-running queries
SELECT pid, usename, state, query, age(clock_timestamp(), query_start) as age
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY age DESC;
```

### Index Health

```sql
-- Missing indexes (slow queries)
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY abs(correlation) DESC;

-- Unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Index size
SELECT schemaname, tablename, indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Query Performance

```sql
-- Enable query stats
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Slowest queries
SELECT query, calls, total_exec_time, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Maintenance Tasks

### Vacuum (Cleanup)

```bash
# Auto-vacuum (recommended, enabled by default)
# Manual vacuum if needed:
docker compose exec db vacuumdb -U postgres -z ai_saas

# Full vacuum (requires downtime)
docker compose exec db vacuumdb -U postgres -f ai_saas
```

### Analyze (Statistics)

```bash
# Update table statistics for query planner
docker compose exec db psql -U postgres ai_saas -c "ANALYZE;"
```

### Reindex

```bash
# If index bloat is suspected
docker compose exec db reindexdb -U postgres ai_saas
```

## Troubleshooting

### "Too many connections"

**Solution 1**: Increase max_connections
```sql
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
```

**Solution 2**: Use connection pooling (PgBouncer)

**Solution 3**: Reduce connection_limit in DATABASE_URL

### "Slow queries"

```sql
-- Find slow queries
SELECT query, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_messages_conversation_created
ON "Message"(conversationId, createdAt DESC);
```

### "Database locked"

```sql
-- Find blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS blocking_statement
FROM pg_locks blocked_locks
JOIN pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
JOIN pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted;

-- Kill blocking query (last resort)
SELECT pg_terminate_backend(<blocking_pid>);
```

## Security

### Create Read-Only User

```sql
CREATE USER readonly WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ai_saas TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO readonly;
```

### Rotate Database Password

```bash
# 1. Create new password
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Update database
ALTER USER postgres WITH PASSWORD '$NEW_PASSWORD';

# 3. Update DATABASE_URL in secrets
# 4. Rolling restart of application
kubectl rollout restart deployment/ai-saas-web -n ai-saas-prod
```

---

**Last Updated**: 2025-10-09
