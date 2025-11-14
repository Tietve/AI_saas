# Production Deployment Documentation

Welcome to the My-SaaS-Chat production deployment documentation. This directory contains comprehensive guides for deploying and maintaining the platform in production.

---

## Quick Navigation

### Getting Started

1. **[Phase 4 Summary](../../PHASE-4-SUMMARY.md)** - Executive summary of deployment infrastructure
2. **[Production Deployment Guide](../../PRODUCTION-DEPLOYMENT.md)** - Quick start guide (5 steps to deploy)
3. **[Deployment Checklist](../../DEPLOYMENT-CHECKLIST.md)** - 250+ item checklist (print and use)

### Detailed Guides

4. **[Database Backup Strategy](./database-backup.md)** - Complete backup & disaster recovery guide
5. **[Health Check Implementation](./health-checks.md)** - Health monitoring implementation

### Configuration

6. **[Root Environment Variables](../../.env.example)** - All 200+ variables documented
7. **[Docker Compose Production](../../docker-compose.prod.yml)** - Complete orchestration
8. **[CI/CD Pipeline](../../.github/workflows/production.yml)** - GitHub Actions workflow

---

## Documentation Structure

```
docs/deployment/
├── README.md (this file)
├── database-backup.md         # Backup & restore procedures
├── health-checks.md            # Health monitoring guide
└── [future guides]

Root documentation:
├── PHASE-4-SUMMARY.md          # Executive summary
├── PRODUCTION-DEPLOYMENT.md    # Quick start guide
└── DEPLOYMENT-CHECKLIST.md     # Complete checklist

Configuration:
├── .env.example                # Environment variables
├── docker-compose.prod.yml     # Production orchestration
├── nginx/                      # Nginx configuration
├── scripts/                    # Backup/restore scripts
└── .github/workflows/          # CI/CD pipelines
```

---

## Deployment Process Overview

### Phase 1: Preparation (2 hours)

**What:** Setup server, generate secrets, configure external services
**Key Files:**
- `.env.example` - Copy to `.env` and fill in values
- `DEPLOYMENT-CHECKLIST.md` - Follow Phase 1-4

**Actions:**
1. Provision server (8GB RAM, 4 CPU)
2. Install Docker & Docker Compose
3. Generate secrets (`openssl rand -hex 32`)
4. Configure external services (OpenAI, Stripe, SMTP)

### Phase 2: Initial Deployment (2 hours)

**What:** Deploy infrastructure and services
**Key Files:**
- `docker-compose.prod.yml` - Main orchestration file
- `scripts/backup.sh` - Backup automation

**Actions:**
1. Clone repository
2. Configure environment (`.env`)
3. Start infrastructure (`docker-compose up -d`)
4. Run migrations
5. Obtain SSL certificates

### Phase 3: Verification (1 hour)

**What:** Test all components
**Key Files:**
- `PRODUCTION-DEPLOYMENT.md` - Verification commands
- `docs/deployment/health-checks.md` - Health endpoint testing

**Actions:**
1. Test health endpoints
2. Verify database connections
3. Test backup creation
4. Check monitoring dashboards

### Phase 4: Go Live (Ongoing)

**What:** Monitor and maintain
**Key Files:**
- `docs/deployment/database-backup.md` - Backup procedures
- `.github/workflows/production.yml` - Automated deployments

**Actions:**
1. Monitor service health
2. Review logs
3. Respond to alerts
4. Perform monthly backup tests

---

## Key Concepts

### Environment Configuration

**Hierarchical Structure:**
```
Root .env
  ├─ Shared variables (all services)
  └─ Service overrides
      ├─ auth-service/.env.production
      ├─ chat-service/.env.production
      ├─ billing-service/.env.production
      ├─ analytics-service/.env.production
      ├─ orchestrator-service/.env.production
      └─ email-worker/.env.production
```

**Priority:** Service-specific > Root > Defaults

### Docker Architecture

**Multi-Stage Builds:**
```
Stage 1 (deps): Install dependencies
  ↓
Stage 2 (builder): Build TypeScript
  ↓
Stage 3 (runner): Production runtime
  → Non-root user (UID 1001)
  → Alpine Linux base
  → Health checks built-in
```

### Health Monitoring

**Three Types:**
1. **Liveness** (`/health/live`) - Is service running?
2. **Readiness** (`/health/ready`) - Can service accept traffic?
3. **Detailed** (`/health/detailed`) - Component status + metrics

### Backup Strategy

**Schedule:**
- Daily full backups at 2 AM UTC
- Incremental backups every 6 hours
- WAL archiving for PITR

**Retention:**
- Local: 7 days
- S3 Daily: 30 days
- S3 Weekly: 90 days
- S3 Monthly: 1 year

**Recovery Objectives:**
- RTO (Recovery Time): 2 hours
- RPO (Recovery Point): 6 hours

---

## Common Operations

### Deploy Update

```bash
# Via CI/CD (recommended)
git tag v1.0.1
git push origin v1.0.1

# Manual
git pull
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f auth-service

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 chat-service
```

### Health Check

```bash
# All services
curl http://localhost/health

# Individual services
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # Chat
curl http://localhost:3003/health  # Billing
curl http://localhost:3004/health  # Analytics
curl http://localhost:3006/health  # Orchestrator
```

### Backup Operations

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec backup-service /backup.sh

# List backups
./scripts/restore.sh -l

# Restore from date
./scripts/restore.sh -d 20240115
```

### Restart Service

```bash
# Single service
docker-compose -f docker-compose.prod.yml restart auth-service

# All services
docker-compose -f docker-compose.prod.yml restart
```

---

## Troubleshooting

### Service Won't Start

1. Check logs: `docker-compose logs service-name`
2. Verify environment: `docker-compose config`
3. Check dependencies: `docker-compose ps`
4. Verify ports: `netstat -tulpn | grep port`

**Common Issues:**
- Missing environment variables
- Database not ready
- Port already in use
- Insufficient resources

### Database Connection Failed

1. Check database health:
   ```bash
   docker-compose exec postgres pg_isready
   docker-compose exec redis redis-cli PING
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

2. Verify DATABASE_URL format:
   ```
   postgresql://user:pass@host:5432/database?schema=public
   ```

3. Check network connectivity:
   ```bash
   docker-compose exec service-name ping postgres
   ```

### Health Check Failing

1. Test endpoint directly:
   ```bash
   curl -v http://localhost:3001/health
   ```

2. Check service logs:
   ```bash
   docker-compose logs service-name
   ```

3. Verify dependencies (database, Redis, etc.)

### Backup Failed

1. Check disk space:
   ```bash
   df -h
   ```

2. Verify database connectivity:
   ```bash
   docker-compose exec backup-service pg_isready
   ```

3. Check S3 credentials:
   ```bash
   docker-compose exec backup-service aws sts get-caller-identity
   ```

---

## Monitoring & Alerts

### Access Monitoring Tools

**Jaeger (Distributed Tracing):**
- URL: http://your-server:16686
- Use: Trace requests across services

**Prometheus (Metrics):**
- URL: http://your-server:9090
- Use: Query metrics, create alerts

**Grafana (Dashboards):**
- URL: http://your-server:3100
- Default: admin/admin
- Use: Visualize metrics

**RabbitMQ (Message Queue):**
- URL: http://your-server:15672
- Use: Monitor queue health

### Key Metrics to Monitor

**Service Health:**
- Response time (< 200ms target)
- Error rate (< 1% target)
- Request throughput
- Active connections

**Infrastructure:**
- CPU usage (< 80%)
- Memory usage (< 80%)
- Disk usage (< 85%)
- Network I/O

**Database:**
- Query latency
- Connection pool usage
- Cache hit rate
- Slow queries

**Backup:**
- Last backup age (< 24 hours)
- Backup size (track growth)
- Restore test success (monthly)

---

## Security Best Practices

### Before Deployment

- [ ] All secrets generated (not defaults)
- [ ] .env files not committed to git
- [ ] SSL certificates obtained
- [ ] Firewall configured (ports 80, 443 only)
- [ ] Database passwords changed
- [ ] API keys configured (production mode)

### During Operations

- [ ] Regular security updates
- [ ] Monitor for vulnerabilities
- [ ] Review access logs
- [ ] Test disaster recovery
- [ ] Audit user permissions

### Compliance

- [ ] Backup retention policy documented
- [ ] Data encryption at rest (S3)
- [ ] Data encryption in transit (TLS)
- [ ] Access logging enabled
- [ ] Incident response plan documented

---

## Support & Resources

### Documentation

- **Production Deployment:** [PRODUCTION-DEPLOYMENT.md](../../PRODUCTION-DEPLOYMENT.md)
- **Deployment Checklist:** [DEPLOYMENT-CHECKLIST.md](../../DEPLOYMENT-CHECKLIST.md)
- **Backup Strategy:** [database-backup.md](./database-backup.md)
- **Health Checks:** [health-checks.md](./health-checks.md)
- **Full Report:** [phase-4-implementation-report.md](../../plans/20251112-production-readiness-audit/phase-4-implementation-report.md)

### Quick Reference

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# View status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl http://localhost/health

# Backup
./scripts/backup.sh

# Restore
./scripts/restore.sh -l
```

### Getting Help

**Documentation Issues:**
- Create GitHub issue
- Tag: documentation

**Deployment Issues:**
- Check troubleshooting section
- Review logs
- Contact DevOps team

**Emergency:**
- PagerDuty rotation
- Slack: #infrastructure-critical
- Email: ops@yourdomain.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-12 | Initial documentation suite |

---

## Contributing

To improve this documentation:

1. Make changes to relevant files
2. Test deployment procedure
3. Update version history
4. Submit pull request

---

## License

Documentation: MIT License
Project: [Your License]

---

**Last Updated:** 2025-11-12
**Maintained By:** Infrastructure Team
**Review Schedule:** Quarterly
