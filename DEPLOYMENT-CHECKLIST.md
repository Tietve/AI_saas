# Production Deployment Checklist

> **Complete checklist for deploying My-SaaS-Chat to production**
>
> Print this checklist and check off items as you complete them.

---

## Phase 1: Pre-Deployment Preparation

### Infrastructure Setup

- [ ] **Provision Server**
  - [ ] Minimum 8GB RAM, 4 CPU cores
  - [ ] 100GB+ storage
  - [ ] Ubuntu 22.04 LTS or similar
  - [ ] Static IP address assigned

- [ ] **Install Dependencies**
  - [ ] Docker 24+ installed
  - [ ] Docker Compose 2.0+ installed
  - [ ] Git installed
  - [ ] AWS CLI installed (for S3 backups)
  - [ ] curl/wget installed

- [ ] **Configure Firewall**
  - [ ] Allow port 80 (HTTP)
  - [ ] Allow port 443 (HTTPS)
  - [ ] Allow port 22 (SSH) from specific IPs
  - [ ] Block all other ports
  - [ ] UFW or iptables configured

- [ ] **DNS Configuration**
  - [ ] Domain purchased
  - [ ] A record for api.yourdomain.com → server IP
  - [ ] A record for www.yourdomain.com → server IP
  - [ ] DNS propagated (check with dig/nslookup)

---

## Phase 2: Repository Setup

- [ ] **Clone Repository**
  ```bash
  git clone <your-repo-url>
  cd my-saas-chat
  ```

- [ ] **Create .env File**
  ```bash
  cp .env.example .env
  ```

- [ ] **Generate Secrets**
  - [ ] JWT_SECRET: `openssl rand -hex 32`
  - [ ] AUTH_SECRET: `openssl rand -hex 32`
  - [ ] REFRESH_TOKEN_SECRET: `openssl rand -hex 32`
  - [ ] Add to .env file

---

## Phase 3: External Services Configuration

### Database Passwords

- [ ] **PostgreSQL Password**
  - [ ] Generate: `openssl rand -base64 32`
  - [ ] Set POSTGRES_PASSWORD in .env

- [ ] **MongoDB Password**
  - [ ] Generate: `openssl rand -base64 32`
  - [ ] Set MONGO_INITDB_ROOT_PASSWORD in .env

- [ ] **Redis Password** (optional)
  - [ ] Generate if needed
  - [ ] Set REDIS_PASSWORD in .env

- [ ] **ClickHouse Password**
  - [ ] Generate: `openssl rand -base64 32`
  - [ ] Set CLICKHOUSE_PASSWORD in .env

- [ ] **RabbitMQ Password**
  - [ ] Generate: `openssl rand -base64 32`
  - [ ] Set RABBITMQ_DEFAULT_PASS in .env

### AI Service Keys

- [ ] **OpenAI**
  - [ ] Create API key at platform.openai.com
  - [ ] Set OPENAI_API_KEY in .env
  - [ ] Add payment method to OpenAI account

- [ ] **Anthropic** (optional)
  - [ ] Create API key at console.anthropic.com
  - [ ] Set ANTHROPIC_API_KEY in .env

- [ ] **Google AI** (optional)
  - [ ] Create API key at cloud.google.com
  - [ ] Set GOOGLE_API_KEY in .env

- [ ] **Pinecone**
  - [ ] Create account at pinecone.io
  - [ ] Create index named "prompt-upgrader"
  - [ ] Set PINECONE_API_KEY in .env
  - [ ] Set PINECONE_ENVIRONMENT in .env

### Payment Integration

- [ ] **Stripe Configuration**
  - [ ] Create Stripe account (production mode)
  - [ ] Get secret key (sk_live_...)
  - [ ] Get publishable key (pk_live_...)
  - [ ] Create webhook endpoint
  - [ ] Get webhook secret (whsec_...)
  - [ ] Create pricing plans
  - [ ] Set all Stripe variables in .env

### Email Service

- [ ] **SMTP Configuration**
  - [ ] Choose email provider (Gmail, SendGrid, etc.)
  - [ ] Create app-specific password
  - [ ] Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
  - [ ] Test email sending

### Monitoring Services

- [ ] **Sentry** (optional but recommended)
  - [ ] Create Sentry project
  - [ ] Get DSN
  - [ ] Set SENTRY_DSN in .env

- [ ] **Slack Notifications** (optional)
  - [ ] Create Slack webhook
  - [ ] Set SLACK_WEBHOOK in GitHub secrets

---

## Phase 4: AWS S3 Backup Setup

- [ ] **Create S3 Bucket**
  ```bash
  aws s3 mb s3://my-saas-chat-backups --region us-east-1
  ```

- [ ] **Enable Encryption**
  ```bash
  aws s3api put-bucket-encryption \
    --bucket my-saas-chat-backups \
    --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
  ```

- [ ] **Set Lifecycle Policy**
  - [ ] Delete backups older than 30 days
  - [ ] Transition to Glacier after 7 days (optional)

- [ ] **Configure IAM**
  - [ ] Create IAM user for backups
  - [ ] Grant S3 PutObject, GetObject, ListBucket permissions
  - [ ] Set AWS_ACCESS_KEY_ID in .env
  - [ ] Set AWS_SECRET_ACCESS_KEY in .env

- [ ] **Set Backup Variables**
  - [ ] BACKUP_S3_BUCKET=my-saas-chat-backups
  - [ ] BACKUP_RETENTION_DAYS=30
  - [ ] AWS_REGION=us-east-1

---

## Phase 5: SSL/TLS Certificates

### Option A: Let's Encrypt (Recommended)

- [ ] **Start Nginx**
  ```bash
  docker-compose -f docker-compose.prod.yml up -d nginx
  ```

- [ ] **Obtain Certificate**
  ```bash
  docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    -d api.yourdomain.com \
    --email admin@yourdomain.com \
    --agree-tos
  ```

- [ ] **Update Nginx Config**
  - [ ] Uncomment SSL lines in nginx/conf.d/api.conf
  - [ ] Update domain names
  - [ ] Reload Nginx

### Option B: Custom Certificate

- [ ] Upload certificate files to server
- [ ] Update nginx/conf.d/api.conf with paths
- [ ] Reload Nginx

---

## Phase 6: Initial Deployment

### Start Infrastructure

- [ ] **Start Databases First**
  ```bash
  docker-compose -f docker-compose.prod.yml up -d \
    postgres redis mongodb clickhouse rabbitmq
  ```

- [ ] **Wait for Health Checks** (30 seconds)
  ```bash
  sleep 30
  ```

- [ ] **Verify Databases**
  - [ ] PostgreSQL: `docker-compose exec postgres pg_isready`
  - [ ] Redis: `docker-compose exec redis redis-cli PING`
  - [ ] MongoDB: `docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"`
  - [ ] ClickHouse: `docker-compose exec clickhouse clickhouse-client --query "SELECT 1"`
  - [ ] RabbitMQ: `docker-compose exec rabbitmq rabbitmq-diagnostics ping`

### Deploy Services

- [ ] **Start All Services**
  ```bash
  docker-compose -f docker-compose.prod.yml up -d
  ```

- [ ] **View Logs**
  ```bash
  docker-compose -f docker-compose.prod.yml logs -f
  ```
  - [ ] No error messages in logs
  - [ ] All services started successfully

- [ ] **Check Container Status**
  ```bash
  docker-compose -f docker-compose.prod.yml ps
  ```
  - [ ] All containers show "Up" status
  - [ ] All health checks passing

---

## Phase 7: Database Migrations

- [ ] **Auth Service**
  ```bash
  docker-compose -f docker-compose.prod.yml exec auth-service \
    npx prisma migrate deploy
  ```

- [ ] **Chat Service**
  ```bash
  docker-compose -f docker-compose.prod.yml exec chat-service \
    npx prisma migrate deploy
  ```

- [ ] **Billing Service**
  ```bash
  docker-compose -f docker-compose.prod.yml exec billing-service \
    npx prisma migrate deploy
  ```

- [ ] **Orchestrator Service**
  ```bash
  docker-compose -f docker-compose.prod.yml exec orchestrator-service \
    npx prisma migrate deploy
  ```

- [ ] **Verify Migrations**
  - [ ] No errors in migration output
  - [ ] Tables created in database

---

## Phase 8: Health Check Verification

### Test Health Endpoints

- [ ] **Main Health**
  ```bash
  curl -f http://localhost:80/health
  ```

- [ ] **Auth Service**
  ```bash
  curl -f http://localhost:3001/health
  curl -f http://localhost:3001/health/detailed
  ```

- [ ] **Chat Service**
  ```bash
  curl -f http://localhost:3002/health
  curl -f http://localhost:3002/health/detailed
  ```

- [ ] **Billing Service**
  ```bash
  curl -f http://localhost:3003/health
  curl -f http://localhost:3003/health/detailed
  ```

- [ ] **Analytics Service**
  ```bash
  curl -f http://localhost:3004/health
  curl -f http://localhost:3004/health/detailed
  ```

- [ ] **Orchestrator Service**
  ```bash
  curl -f http://localhost:3006/health
  curl -f http://localhost:3006/health/detailed
  ```

### External Health Checks

- [ ] **HTTPS Access**
  ```bash
  curl -f https://api.yourdomain.com/health
  ```

- [ ] **API Gateway**
  ```bash
  curl -f https://api.yourdomain.com/api/auth/health
  ```

---

## Phase 9: Backup Verification

- [ ] **Test Manual Backup**
  ```bash
  docker-compose -f docker-compose.prod.yml exec backup-service /backup.sh
  ```

- [ ] **Verify Backup Created**
  ```bash
  docker-compose -f docker-compose.prod.yml exec backup-service \
    ls -lh /backups/
  ```

- [ ] **Verify S3 Upload**
  ```bash
  aws s3 ls s3://my-saas-chat-backups/backups/
  ```

- [ ] **Test Restore (Optional)**
  ```bash
  ./scripts/restore.sh -l  # List backups
  ```

---

## Phase 10: Monitoring Setup

- [ ] **Access Jaeger**
  - [ ] Open http://your-server:16686
  - [ ] Verify traces visible

- [ ] **Access Prometheus**
  - [ ] Open http://your-server:9090
  - [ ] Verify metrics visible
  - [ ] Check targets (Status → Targets)

- [ ] **Access Grafana**
  - [ ] Open http://your-server:3100
  - [ ] Login with admin/admin
  - [ ] Change default password
  - [ ] Add Prometheus data source
  - [ ] Import dashboards

- [ ] **Access RabbitMQ**
  - [ ] Open http://your-server:15672
  - [ ] Login with configured credentials
  - [ ] Verify queues visible

---

## Phase 11: GitHub Actions CI/CD

### Configure Secrets

- [ ] **SSH Access**
  - [ ] Generate SSH key for deployment
  - [ ] Add public key to server's authorized_keys
  - [ ] Add private key to GitHub Secrets

- [ ] **GitHub Secrets**
  - [ ] STAGING_SSH_KEY
  - [ ] STAGING_HOST
  - [ ] STAGING_USER
  - [ ] PRODUCTION_SSH_KEY
  - [ ] PRODUCTION_HOST
  - [ ] PRODUCTION_USER
  - [ ] SLACK_WEBHOOK (optional)

### Test CI/CD

- [ ] **Create Test Branch**
  ```bash
  git checkout -b test-deployment
  git push origin test-deployment
  ```

- [ ] **Verify Workflow**
  - [ ] Go to Actions tab in GitHub
  - [ ] Verify workflow triggered
  - [ ] Check all jobs pass

- [ ] **Test Deployment**
  - [ ] Merge to main (triggers staging)
  - [ ] Create tag (triggers production)
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```

---

## Phase 12: Functional Testing

### API Testing

- [ ] **Auth Endpoints**
  - [ ] Register new user
  - [ ] Login
  - [ ] Get user profile
  - [ ] Logout

- [ ] **Chat Endpoints**
  - [ ] Create chat
  - [ ] Send message
  - [ ] Get chat history
  - [ ] Delete chat

- [ ] **Billing Endpoints**
  - [ ] Create checkout session
  - [ ] Webhook processing
  - [ ] Subscription status

### Integration Testing

- [ ] **End-to-End Flow**
  - [ ] Register → Login → Create Chat → Send Message
  - [ ] No errors in flow
  - [ ] Data persisted correctly

- [ ] **WebSocket Testing**
  - [ ] Connect to WebSocket
  - [ ] Send/receive messages in real-time
  - [ ] No disconnections

---

## Phase 13: Performance Testing

- [ ] **Load Testing** (optional)
  - [ ] Use k6, Apache Bench, or similar
  - [ ] Test with 100 concurrent users
  - [ ] Verify response times < 200ms
  - [ ] No memory leaks

- [ ] **Database Performance**
  - [ ] Check query performance
  - [ ] Verify indexes exist
  - [ ] No N+1 queries

---

## Phase 14: Security Verification

- [ ] **Security Scan**
  - [ ] Run Trivy scan on images
  - [ ] No CRITICAL vulnerabilities
  - [ ] Address HIGH vulnerabilities

- [ ] **Penetration Testing** (recommended)
  - [ ] SQL injection tests
  - [ ] XSS tests
  - [ ] CSRF tests
  - [ ] Authentication bypass tests

- [ ] **SSL/TLS Check**
  - [ ] Test on ssllabs.com
  - [ ] Grade A or A+ rating

- [ ] **Headers Check**
  - [ ] Test on securityheaders.com
  - [ ] All security headers present

---

## Phase 15: Documentation

- [ ] **Create Runbook**
  - [ ] Common operations documented
  - [ ] Troubleshooting guide
  - [ ] Emergency contacts

- [ ] **Update README**
  - [ ] Production URL
  - [ ] API documentation link
  - [ ] Support information

- [ ] **Team Onboarding**
  - [ ] Share access credentials (securely)
  - [ ] Train team on operations
  - [ ] Set up on-call rotation

---

## Phase 16: Post-Deployment

### Monitoring Setup

- [ ] **Configure Alerts**
  - [ ] High CPU usage
  - [ ] High memory usage
  - [ ] Service down
  - [ ] Backup failures
  - [ ] SSL expiration

- [ ] **Dashboard Creation**
  - [ ] Import Grafana dashboards
  - [ ] Customize for services
  - [ ] Share with team

### Operations

- [ ] **Schedule Maintenance Windows**
  - [ ] Weekly update time
  - [ ] Monthly security patches

- [ ] **Backup Verification**
  - [ ] Monthly restore tests scheduled
  - [ ] Documented in calendar

- [ ] **Incident Response Plan**
  - [ ] Created and documented
  - [ ] Team trained
  - [ ] Contact list updated

---

## Phase 17: Go-Live Checklist

### Final Verification

- [ ] **All Services Running**
  - [ ] docker ps shows all containers healthy
  - [ ] No restart loops

- [ ] **All Health Checks Passing**
  - [ ] Run health check script
  - [ ] All green

- [ ] **SSL Working**
  - [ ] HTTPS accessible
  - [ ] No certificate warnings
  - [ ] Auto-renewal configured

- [ ] **Backups Working**
  - [ ] Automated backups configured
  - [ ] Test backup completed
  - [ ] S3 upload verified

- [ ] **Monitoring Active**
  - [ ] Alerts configured
  - [ ] Dashboards accessible
  - [ ] Logs aggregated

### Communication

- [ ] **Notify Stakeholders**
  - [ ] Product team
  - [ ] Marketing team
  - [ ] Support team

- [ ] **Update Status Page**
  - [ ] Set to "operational"
  - [ ] Remove maintenance notice

- [ ] **Announce Launch**
  - [ ] Social media
  - [ ] Email list
  - [ ] Documentation site

---

## Phase 18: Post-Launch Monitoring (First 24 Hours)

- [ ] **Hour 1-4: Intensive Monitoring**
  - [ ] Watch logs continuously
  - [ ] Monitor error rates
  - [ ] Check response times
  - [ ] Verify user registrations working

- [ ] **Hour 4-8: Regular Monitoring**
  - [ ] Check every 30 minutes
  - [ ] Review metrics dashboard
  - [ ] Check backup completion

- [ ] **Hour 8-24: Normal Operations**
  - [ ] Check every 2 hours
  - [ ] Review daily reports
  - [ ] Address any issues

- [ ] **24 Hour Review**
  - [ ] Document issues encountered
  - [ ] Create improvement tickets
  - [ ] Share lessons learned

---

## Emergency Contacts

**During Deployment:**
- DevOps Lead: ________________
- Backend Lead: ________________
- On-Call Engineer: ________________

**Post-Deployment:**
- PagerDuty: ________________
- Slack Channel: ________________
- Email: ________________

---

## Sign-Off

**Deployment Completed By:**

Name: ____________________________
Date: ____________________________
Time: ____________________________

**Verified By:**

Name: ____________________________
Date: ____________________________

**Production Status:** □ GO LIVE

---

## Notes / Issues Encountered

```
[Use this space to document any issues encountered during deployment
 and how they were resolved]









```

---

**Checklist Version:** 1.0
**Last Updated:** 2025-11-12
**Total Checklist Items:** 250+

**Estimated Completion Time:** 4-6 hours (first deployment)
**Follow-up Time:** 24 hours intensive monitoring

---

**Status Key:**
- [ ] Not started
- [x] Completed
- [~] In progress
- [!] Blocked/Issue

---

**Print this checklist and keep it with your deployment documentation!**
