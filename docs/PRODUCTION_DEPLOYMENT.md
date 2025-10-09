# Production Deployment Guide

Complete guide for deploying the AI SaaS platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [CI/CD Setup](#cicd-setup)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js** 20+ (LTS)
- **PostgreSQL** 15+
- **Redis** 7+
- **Docker** 24+ & Docker Compose 2+
- **kubectl** (for Kubernetes)
- **Git**

### API Keys & Credentials

Prepare the following:

- ✅ OpenAI API key
- ✅ Anthropic API key (optional)
- ✅ Google AI API key (optional)
- ✅ PayOS credentials (payment gateway)
- ✅ SMTP credentials (email)
- ✅ Domain name & SSL certificate

### Infrastructure

**Minimum Requirements**:
- 2 vCPUs, 4GB RAM (per app instance)
- PostgreSQL: 2 vCPUs, 4GB RAM, 20GB SSD
- Redis: 1 vCPU, 1GB RAM

**Recommended (Production)**:
- 3 app instances (4 vCPUs, 8GB RAM each)
- PostgreSQL: 4 vCPUs, 8GB RAM, 100GB SSD
- Redis: 2 vCPUs, 2GB RAM
- Load balancer (Nginx/Kubernetes Ingress)

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/ai-saas-platform.git
cd ai-saas-platform
```

### 2. Create Environment File

```bash
cp .env.docker.example .env.production
```

### 3. Configure Environment Variables

Edit `.env.production`:

```bash
# Database
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=ai_saas_prod
DATABASE_URL=postgresql://user:pass@postgres:5432/ai_saas_prod?schema=public

# Redis
REDIS_PASSWORD=your_redis_password
REDIS_URL=redis://:your_redis_password@redis:6379

# Auth (Generate: openssl rand -base64 32)
AUTH_SECRET=your_32_character_secret_here

# AI Providers
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key
GOOGLE_AI_API_KEY=your-google-key

# Payment
PAYOS_CLIENT_ID=your-client-id
PAYOS_API_KEY=your-api-key
PAYOS_CHECKSUM_KEY=your-checksum-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
SMTP_FROM="AI SaaS <noreply@yourdomain.com>"

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Docker Deployment

### Option 1: Docker Compose (Simple)

Best for: Single server deployment

**1. Start services**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**2. Check status**:
```bash
docker-compose -f docker-compose.prod.yml ps
```

**3. View logs**:
```bash
docker-compose -f docker-compose.prod.yml logs -f app-1
```

**4. Run migrations**:
```bash
docker exec ai-saas-app-1 npx prisma migrate deploy
```

**5. Access application**:
```
http://your-server-ip
```

### Option 2: Docker Swarm (Multi-Server)

Best for: Multiple servers with orchestration

**1. Initialize Swarm**:
```bash
docker swarm init
```

**2. Deploy stack**:
```bash
docker stack deploy -c docker-compose.prod.yml ai-saas
```

**3. Check services**:
```bash
docker service ls
docker service logs ai-saas_app-1
```

**4. Scale services**:
```bash
docker service scale ai-saas_app-1=5
```

---

## Kubernetes Deployment

Best for: Enterprise-grade, auto-scaling deployments

### Prerequisites

1. **Kubernetes cluster** (GKE, EKS, AKS, or self-hosted)
2. **kubectl** configured
3. **Helm** (optional but recommended)
4. **cert-manager** (for SSL)
5. **NGINX Ingress Controller**

### Step-by-Step Deployment

#### 1. Create Kubernetes Secrets

```bash
# Create secret.yaml from template
cp k8s/secret.yaml.example k8s/secret.yaml

# Encode your values
echo -n "your-password" | base64

# Edit secret.yaml with encoded values
vi k8s/secret.yaml
```

#### 2. Review Configuration

Edit `k8s/configmap.yaml`:
- Update `NEXT_PUBLIC_APP_URL`
- Adjust feature flags
- Set resource limits

Edit `k8s/ingress.yaml`:
- Update domain name
- Configure SSL certificate

#### 3. Deploy with Script

```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

Or manually:

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create ConfigMap & Secrets
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres.yaml

# Deploy Redis
kubectl apply -f k8s/redis.yaml

# Deploy Application
kubectl apply -f k8s/deployment.yaml

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml
```

#### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n ai-saas

# Check services
kubectl get svc -n ai-saas

# Check ingress
kubectl get ingress -n ai-saas

# View logs
kubectl logs -f -l app=ai-saas-app -n ai-saas
```

#### 5. Access Application

```bash
# Get external IP
kubectl get ingress -n ai-saas

# Or port-forward for testing
kubectl port-forward -n ai-saas svc/ai-saas-service 3000:80
```

### Installing Prerequisites

**Install NGINX Ingress Controller**:
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

**Install cert-manager**:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

---

## CI/CD Setup

### GitHub Actions (Automated Deployment)

#### 1. Configure GitHub Secrets

Go to: `Settings` → `Secrets and variables` → `Actions`

Add secrets:
- `KUBE_CONFIG` - Base64 encoded kubeconfig
- `DEPLOY_HOST` - Production server IP (for Docker)
- `DEPLOY_USER` - SSH username
- `DEPLOY_SSH_KEY` - SSH private key
- `SNYK_TOKEN` - Security scanning (optional)

**Get kubeconfig**:
```bash
cat ~/.kube/config | base64
```

#### 2. Push to Main Branch

```bash
git push origin main
```

Workflows will:
1. ✅ Run tests
2. ✅ Build Docker image
3. ✅ Push to registry
4. ✅ Deploy to Kubernetes
5. ✅ Run migrations
6. ✅ Health check
7. ✅ Rollback if failed

#### 3. Monitor Deployment

- Go to `Actions` tab in GitHub
- View workflow progress
- Check logs for each step

### Manual Deployment Steps

If not using CI/CD:

```bash
# 1. Build Docker image
docker build -t ai-saas:v1.0.0 .

# 2. Tag for registry
docker tag ai-saas:v1.0.0 ghcr.io/your-org/ai-saas:v1.0.0

# 3. Push to registry
docker push ghcr.io/your-org/ai-saas:v1.0.0

# 4. Update Kubernetes deployment
kubectl set image deployment/ai-saas-app \
  app=ghcr.io/your-org/ai-saas:v1.0.0 \
  -n ai-saas

# 5. Wait for rollout
kubectl rollout status deployment/ai-saas-app -n ai-saas
```

---

## Post-Deployment

### 1. Run Database Migrations

```bash
# Docker
docker exec ai-saas-app-1 npx prisma migrate deploy

# Kubernetes
kubectl exec -n ai-saas deployment/ai-saas-app -- \
  npx prisma migrate deploy
```

### 2. Verify Health

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 120,
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-01-04T10:00:00Z"
}
```

### 3. Test Key Features

- ✅ User signup
- ✅ User login
- ✅ Chat functionality
- ✅ AI responses
- ✅ Payment flow
- ✅ Email sending

### 4. Setup Monitoring

**Application Logs**:
```bash
# Docker
docker logs -f ai-saas-app-1

# Kubernetes
kubectl logs -f -l app=ai-saas-app -n ai-saas
```

**Metrics Endpoints**:
- `/api/health` - Health status
- `/api/metrics/health` - Provider health
- `/api/metrics/dashboard` - Performance metrics

### 5. Configure Backups

**PostgreSQL Backups**:
```bash
# Setup cron job
crontab -e

# Daily backup at 2 AM
0 2 * * * pg_dump -U postgres -d ai_saas_prod -F c > /backups/db_$(date +\%Y\%m\%d).dump
```

**Backup Retention**:
```bash
# Keep 7 days of backups
find /backups -name "db_*.dump" -mtime +7 -delete
```

---

## Monitoring & Maintenance

### Daily Checks

1. **Check application health**:
   ```bash
   curl https://yourdomain.com/api/health
   ```

2. **Monitor error rates**:
   ```bash
   curl https://yourdomain.com/api/metrics/health
   ```

3. **Check logs for errors**:
   ```bash
   kubectl logs -l app=ai-saas-app -n ai-saas --tail=100 | grep ERROR
   ```

### Weekly Tasks

1. **Review metrics dashboard**
2. **Check resource usage** (CPU, Memory)
3. **Review AI provider costs**
4. **Security updates** (npm audit)

### Monthly Tasks

1. **Database cleanup** (old sessions, logs)
2. **Performance optimization**
3. **Capacity planning**
4. **Cost analysis**

### Scaling

**Horizontal Scaling** (Kubernetes):
```bash
# Manual scale
kubectl scale deployment ai-saas-app --replicas=5 -n ai-saas

# Auto-scaling is configured in deployment.yaml
# Scales based on CPU/Memory (70%/80%)
```

**Vertical Scaling**:
```yaml
# Edit k8s/deployment.yaml
resources:
  requests:
    memory: "1Gi"  # Increase
    cpu: "500m"    # Increase
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

---

## Troubleshooting

### Application Won't Start

**Check logs**:
```bash
kubectl logs -l app=ai-saas-app -n ai-saas
```

**Common issues**:
- ❌ Database connection failed → Check DATABASE_URL
- ❌ Redis connection failed → Check REDIS_URL
- ❌ Prisma client not generated → Run `npx prisma generate`

### Database Connection Errors

```bash
# Test connection
kubectl exec -n ai-saas deployment/ai-saas-app -- \
  npx prisma db execute --stdin <<< "SELECT 1;"
```

### High Memory Usage

```bash
# Check memory usage
kubectl top pods -n ai-saas

# Restart pods
kubectl rollout restart deployment/ai-saas-app -n ai-saas
```

### SSL Certificate Issues

```bash
# Check certificate
kubectl describe certificate ai-saas-tls -n ai-saas

# Renew certificate
kubectl delete certificate ai-saas-tls -n ai-saas
kubectl apply -f k8s/ingress.yaml
```

### Rollback Deployment

```bash
# View rollout history
kubectl rollout history deployment/ai-saas-app -n ai-saas

# Rollback to previous version
kubectl rollout undo deployment/ai-saas-app -n ai-saas

# Rollback to specific revision
kubectl rollout undo deployment/ai-saas-app --to-revision=2 -n ai-saas
```

---

## Security Checklist

- [ ] Environment variables secured (not in git)
- [ ] SSL/TLS certificates configured
- [ ] Database connections encrypted
- [ ] Redis password protected
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Regular backups automated
- [ ] Secrets rotated quarterly
- [ ] Dependencies updated monthly

---

## Performance Optimization

### Database

- ✅ Connection pooling (configured in DATABASE_URL)
- ✅ Indexes on frequently queried columns
- ✅ Query optimization (see metrics)

### Caching

- ✅ Redis for session storage
- ✅ Semantic cache for AI responses
- ✅ HTTP caching headers (Nginx)

### Application

- ✅ Next.js optimizations (standalone build)
- ✅ Image optimization (Next.js)
- ✅ Code splitting
- ✅ Gzip compression (Nginx)

---

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [NGINX Ingress](https://kubernetes.github.io/ingress-nginx/)

---

**Need Help?**
- GitHub Issues: `https://github.com/your-org/ai-saas-platform/issues`
- Documentation: `./docs/`
- Email: support@yourdomain.com

**Last Updated**: January 2025
