# Database Migration Workflow

## Overview

This guide covers database migration management for the AI SaaS platform using Prisma.

## Table of Contents

- [Local Development](#local-development)
- [Production Workflow](#production-workflow)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Rollback Procedures](#rollback-procedures)

---

## Local Development

### Creating a New Migration

1. **Make schema changes** in `prisma/schema.prisma`

2. **Generate migration**:
   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```

   This will:
   - Create SQL migration file in `prisma/migrations/`
   - Apply migration to development database
   - Regenerate Prisma Client

3. **Review migration SQL**:
   ```bash
   cat prisma/migrations/YYYYMMDDHHMMSS_describe_your_changes/migration.sql
   ```

4. **Test the migration**:
   ```bash
   npm run dev
   # Test application features
   npm test
   ```

### Example: Adding a new field

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  // New field
  firstName String?  // Add this
  createdAt DateTime @default(now())
}
```

```bash
npx prisma migrate dev --name add_user_first_name
```

### Resetting Development Database

⚠️ **Destructive** - Only use in development!

```bash
npx prisma migrate reset
```

This will:
- Drop database
- Create new database
- Apply all migrations
- Run seed script (if configured)

---

## Production Workflow

### Preparing for Production

1. **Commit migrations** to git:
   ```bash
   git add prisma/migrations
   git commit -m "feat: add user firstName field"
   git push
   ```

2. **Review in staging** environment first
3. **Plan deployment window** for schema changes
4. **Backup database** before migration

### Deploying Migrations to Production

#### Method 1: Manual Deployment

```bash
# SSH into production server
ssh user@production-server

# Navigate to app directory
cd /opt/ai-saas

# Pull latest code
git pull origin main

# Run migrations
npx prisma migrate deploy
```

#### Method 2: Docker Container

```bash
# Run migration in container
docker exec ai-saas-app npx prisma migrate deploy
```

#### Method 3: Kubernetes

```bash
# Run migration in Kubernetes pod
kubectl exec -n ai-saas deployment/ai-saas-app -- \
  npx prisma migrate deploy
```

#### Method 4: CI/CD (Automated)

Migrations run automatically in GitHub Actions:
- See `.github/workflows/cd.yml`
- Migrations run after successful deployment
- Before application pods start (init container)

### Migration Status

Check which migrations have been applied:

```bash
npx prisma migrate status
```

Expected output:
```
Database schema is up to date!
Migrations: 15 applied
```

---

## Best Practices

### 1. **Always Review Generated SQL**

Before committing, check the migration SQL:

```bash
cat prisma/migrations/*/migration.sql
```

Look for:
- Data loss (DROP COLUMN, DROP TABLE)
- Performance issues (missing indexes)
- Breaking changes

### 2. **Use Descriptive Names**

❌ Bad:
```bash
npx prisma migrate dev --name update
```

✅ Good:
```bash
npx prisma migrate dev --name add_user_subscription_tier
```

### 3. **Test Migrations**

```bash
# 1. Create test database
createdb test_db

# 2. Run migrations
DATABASE_URL="postgresql://localhost/test_db" npx prisma migrate deploy

# 3. Verify schema
DATABASE_URL="postgresql://localhost/test_db" npx prisma db pull
```

### 4. **Backup Before Deploying**

```bash
# PostgreSQL backup
pg_dump -U postgres -d mydb -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).dump

# Restore if needed
pg_restore -U postgres -d mydb -v backup_20250104_143000.dump
```

### 5. **Handle Large Tables Carefully**

For tables with millions of rows:

```sql
-- ❌ Dangerous - locks table
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- ✅ Better - use background migration
ALTER TABLE users ADD COLUMN new_field VARCHAR(255) DEFAULT NULL;
-- Then update in batches
```

### 6. **Use Transactions**

Migrations run in transactions by default. For manual SQL:

```sql
BEGIN;
  ALTER TABLE users ADD COLUMN status VARCHAR(50);
  UPDATE users SET status = 'active' WHERE email_verified = true;
COMMIT;
```

---

## Migration Patterns

### Adding Required Field to Existing Table

**Problem**: Can't add NOT NULL column to table with data

**Solution**: Multi-step migration

```sql
-- Step 1: Add nullable field
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);

-- Step 2: Populate with default or migrate data
UPDATE users SET phone_number = 'N/A' WHERE phone_number IS NULL;

-- Step 3: Make required (in next migration)
ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;
```

### Renaming Columns/Tables

**Problem**: Breaking change for running application

**Solution**: Multi-phase deployment

**Phase 1**: Add new column
```sql
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
UPDATE users SET full_name = CONCAT(first_name, ' ', last_name);
```

**Phase 2**: Deploy code that writes to both columns

**Phase 3**: Remove old column
```sql
ALTER TABLE users DROP COLUMN first_name;
ALTER TABLE users DROP COLUMN last_name;
```

### Creating Indexes

**Problem**: Creating index locks table on large datasets

**Solution**: Use CONCURRENTLY

```sql
-- Create index without locking table
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

In Prisma:
```prisma
model User {
  email String @unique
  @@index([email], name: "idx_users_email")
}
```

---

## Troubleshooting

### Migration Failed Halfway

```bash
# Check status
npx prisma migrate status

# Resolve failed migration
npx prisma migrate resolve --applied MIGRATION_NAME
# or
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

### Schema Drift Detected

```
Error: Schema drift detected
```

**Solution**:
```bash
# Generate migration to match current schema
npx prisma migrate dev --create-only
# Review the generated SQL
# Apply
npx prisma migrate dev
```

### Migration Conflict

```
Error: Migration ... conflicts with ...
```

**Solution**:
```bash
# Pull latest migrations
git pull origin main

# Reset local migration history
npx prisma migrate reset

# Regenerate from schema
npx prisma migrate dev
```

---

## Rollback Procedures

### Rollback Last Migration (Development)

```bash
npx prisma migrate reset
```

### Rollback in Production

⚠️ **Careful** - No automatic rollback in production!

**Manual rollback**:

1. **Create reverse migration**:
   ```bash
   npx prisma migrate dev --create-only --name rollback_feature_x
   ```

2. **Write reverse SQL** manually:
   ```sql
   -- If migration added column:
   ALTER TABLE users DROP COLUMN new_column;

   -- If migration created table:
   DROP TABLE new_table;
   ```

3. **Deploy rollback**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Restore from backup** (if needed):
   ```bash
   pg_restore -U postgres -d mydb backup.dump
   ```

### Database Backup Strategy

**Daily backups**:
```bash
# Cron job
0 2 * * * pg_dump -U postgres -d mydb -F c > /backups/mydb_$(date +\%Y\%m\%d).dump
```

**Retention policy**:
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

---

## CI/CD Integration

### Automated Migrations in GitHub Actions

Migrations run automatically:

1. **On deployment** (`.github/workflows/cd.yml`):
   - After Docker image build
   - Before application starts
   - In init container

2. **Migration job**:
   ```yaml
   migrate-db:
     runs-on: ubuntu-latest
     needs: deploy-k8s
     steps:
       - name: Run migrations
         run: |
           kubectl exec deployment/ai-saas-app -- \
             npx prisma migrate deploy
   ```

### Pre-deployment Checks

Before merging PR:

1. ✅ Migration files committed
2. ✅ Schema changes reviewed
3. ✅ Tests pass with new schema
4. ✅ Migration tested in staging
5. ✅ Production backup created

---

## Advanced Topics

### Custom Migration SQL

Sometimes Prisma can't auto-generate correct SQL:

```bash
# Create empty migration
npx prisma migrate dev --create-only --name custom_migration

# Edit migration file manually
code prisma/migrations/*/migration.sql
```

Example - Data migration:
```sql
-- Migrate old data format to new
UPDATE messages
SET metadata = jsonb_build_object('version', 2, 'data', content)
WHERE metadata IS NULL;
```

### Seeding Database

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.createMany({
    data: [
      { email: 'admin@example.com', planTier: 'PRO' },
      { email: 'user@example.com', planTier: 'FREE' },
    ],
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run seed:
```bash
npx prisma db seed
```

---

## Summary Checklist

### Before Creating Migration
- [ ] Schema changes reviewed
- [ ] Backward compatibility considered
- [ ] Performance impact assessed
- [ ] Tests updated

### Before Deploying Migration
- [ ] Migration tested locally
- [ ] Migration tested in staging
- [ ] Database backup created
- [ ] Deployment window scheduled
- [ ] Rollback plan documented

### After Deploying Migration
- [ ] Migration status verified
- [ ] Application health checked
- [ ] Performance monitored
- [ ] Old backup can be cleaned up (after 7 days)

---

## Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)

---

**Last Updated**: January 2025
