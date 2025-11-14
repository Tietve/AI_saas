# 🚀 Production Deployment - Quick Start

Complete production deployment setup for AI SaaS Platform.

## 📋 What's Included

✅ **Docker Support**
- Multi-stage Dockerfile (optimized for production)
- Docker Compose for local dev & production
- Nginx load balancer

✅ **Kubernetes Support**
- Full K8s manifests (namespace, deployments, services, ingress)
- Horizontal Pod Autoscaler (HPA)
- PostgreSQL StatefulSet
- Redis deployment
- SSL/TLS with cert-manager

✅ **CI/CD Pipelines**
- GitHub Actions workflows
- Automated testing
- Docker image building
- Kubernetes deployment
- Database migrations
- Health checks & rollback

✅ **Documentation**
- Database migration workflow
- Production deployment guide
- Environment configuration
- Troubleshooting guide

---

## 🎯 Quick Start Options

Choose your deployment method:

### 1. Docker Compose (Easiest)

Best for: Single server, quick setup

```bash
# 1. Copy environment file
cp .env.docker.example .env

# 2. Configure environment variables
vi .env

# 3. Start services
docker-compose up -d

# 4. Run migrations
docker exec ai-saas-app npx prisma migrate deploy

# 5. Access
http://localhost:3000
```

**Time to deploy**: ~5 minutes

### 2. Docker Compose Production (Multi-Instance)

Best for: Single server with load balancing

```bash
# 1. Setup environment
cp .env.docker.example .env.production
vi .env.production

# 2. Deploy with 3 instances + load balancer
docker-compose -f docker-compose.prod.yml up -d

# 3. Access via Nginx
http://your-server-ip
```

**Time to deploy**: ~10 minutes

### 3. Kubernetes (Most Powerful)

Best for: Enterprise, auto-scaling, high availability

```bash
# 1. Create secrets
cp k8s/secret.yaml.example k8s/secret.yaml
# Edit with base64 encoded values

# 2. Configure domain
vi k8s/ingress.yaml
vi k8s/configmap.yaml

# 3. Deploy
cd k8s
./deploy.sh

# 4. Access
https://your-domain.com
```

**Time to deploy**: ~20 minutes

### 4. CI/CD (Fully Automated)

Best for: Continuous deployment

```bash
# 1. Setup GitHub secrets
# See: docs/PRODUCTION_DEPLOYMENT.md#cicd-setup

# 2. Push to main branch
git push origin main

# 3. GitHub Actions handles everything
```

**Time to deploy**: Automatic on every push

---

## 📦 What Gets Deployed

### Infrastructure Components

```
┌─────────────────────────────────────────┐
│         Nginx Load Balancer             │
│         (Port 80/443)                   │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼───┐     ┌───────▼───┐     ┌─────────▼─┐
│ App-1 │     │   App-2   │     │   App-3   │
│:3000  │     │   :3000   │     │   :3000   │
└───┬───┘     └─────┬─────┘     └─────┬─────┘
    │               │                  │
    └───────────────┼──────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
    ┌────▼─────┐        ┌──────▼────┐
    │PostgreSQL│        │   Redis   │
    │  :5432   │        │   :6379   │
    └──────────┘        └───────────┘
```

### Resource Allocation

**Per App Instance**:
- CPU: 250m-1000m (request-limit)
- Memory: 512Mi-2Gi
- Replicas: 3-10 (auto-scaling)

**PostgreSQL**:
- CPU: 1-2 cores
- Memory: 1-2GB
- Storage: 10-100GB SSD

**Redis**:
- CPU: 100m-500m
- Memory: 256Mi-512Mi
- Storage: 5GB

---

## 🔧 Configuration Files

### Required Files

| File | Purpose | Action |
|------|---------|--------|
| `.env` | Environment variables | Copy from `.env.docker.example` |
| `k8s/secret.yaml` | Kubernetes secrets | Copy from `secret.yaml.example` |
| `k8s/configmap.yaml` | K8s configuration | Update domain & settings |
| `k8s/ingress.yaml` | Domain & SSL | Update your domain |

### Environment Variables

**Critical variables**:
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Redis
REDIS_URL=redis://:password@host:6379

# Auth (32+ characters)
AUTH_SECRET=your_random_32_character_secret

# AI Providers
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key

# Domain
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

See `.env.docker.example` for complete list.

---

## 📊 Architecture Highlights

### Next.js Application

- ✅ **Standalone output** - Optimized Docker image
- ✅ **Multi-stage build** - Small image size (~300MB)
- ✅ **Health checks** - `/api/health` endpoint
- ✅ **Graceful shutdown** - Proper signal handling
- ✅ **Non-root user** - Security best practice

### Database

- ✅ **Connection pooling** - Efficient DB connections
- ✅ **Automatic migrations** - Via init containers
- ✅ **Daily backups** - Automated pg_dump
- ✅ **Replica support** - Read replicas (optional)

### Caching

- ✅ **Redis sessions** - Fast session storage
- ✅ **Semantic cache** - AI response caching
- ✅ **HTTP caching** - Static asset caching

### Load Balancing

- ✅ **Round-robin** - Default LB algorithm
- ✅ **Health checks** - Auto remove unhealthy instances
- ✅ **Session affinity** - Sticky sessions (optional)
- ✅ **SSL termination** - HTTPS at load balancer

---

## 🔒 Security Features

- ✅ **SSL/TLS encryption** - cert-manager + Let's Encrypt
- ✅ **Security headers** - HSTS, CSP, X-Frame-Options
- ✅ **Rate limiting** - Nginx + application-level
- ✅ **CORS protection** - Configured origins
- ✅ **Secrets management** - Kubernetes secrets / Docker secrets
- ✅ **Non-root containers** - Reduced attack surface
- ✅ **Network policies** - Pod-to-pod communication (K8s)

---

## 📈 Scaling

### Horizontal Scaling (Add more instances)

**Docker Compose**:
```bash
docker-compose -f docker-compose.prod.yml up -d --scale app=5
```

**Kubernetes** (automatic):
- Min: 3 replicas
- Max: 10 replicas
- Triggers: CPU > 70%, Memory > 80%

**Manual K8s scaling**:
```bash
kubectl scale deployment ai-saas-app --replicas=5 -n ai-saas
```

### Vertical Scaling (More resources per instance)

Edit `k8s/deployment.yaml`:
```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

---

## 🔍 Monitoring Endpoints

Access these after deployment:

| Endpoint | Purpose |
|----------|---------|
| `/api/health` | Application health status |
| `/api/metrics/health` | AI provider health |
| `/api/metrics/dashboard` | Performance metrics |
| `/api/metrics/cost-breakdown` | Cost analysis |
| `/api/metrics/alerts` | Active alerts |
| `/api/metrics/trends` | Error rate trends |

---

## 📚 Documentation

Detailed guides available:

| Document | Description |
|----------|-------------|
| `PRODUCTION_DEPLOYMENT.md` | Complete deployment guide |
| `DATABASE_MIGRATIONS.md` | Migration workflows |
| `PROVIDER_METRICS.md` | Metrics tracking system |
| `PHASE3_SUMMARY.md` | Architecture overview |

---

## 🚨 Troubleshooting

### Quick Fixes

**Container won't start**:
```bash
# Check logs
docker logs ai-saas-app
kubectl logs -l app=ai-saas-app -n ai-saas

# Check environment
docker exec ai-saas-app env | grep DATABASE_URL
```

**Database connection failed**:
```bash
# Test connection
docker exec ai-saas-app npx prisma db execute --stdin <<< "SELECT 1;"

# Check DATABASE_URL format
# postgresql://user:pass@host:5432/db?schema=public
```

**Migrations won't run**:
```bash
# Check migration status
docker exec ai-saas-app npx prisma migrate status

# Force deploy
docker exec ai-saas-app npx prisma migrate deploy
```

**High memory usage**:
```bash
# Restart containers
docker restart ai-saas-app
kubectl rollout restart deployment/ai-saas-app -n ai-saas
```

See `PRODUCTION_DEPLOYMENT.md` for complete troubleshooting guide.

---

## ✅ Post-Deployment Checklist

After deployment, verify:

- [ ] Application accessible at domain
- [ ] Health check returns 200: `curl https://domain.com/api/health`
- [ ] SSL certificate valid (https://)
- [ ] User signup works
- [ ] User login works
- [ ] Chat functionality works
- [ ] AI responses working
- [ ] Email sending works
- [ ] Payment flow works (if enabled)
- [ ] Database migrations applied
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Logs accessible

---

## 🎯 Performance Targets

Expected performance after deployment:

| Metric | Target |
|--------|--------|
| Response time | < 1s (95th percentile) |
| Concurrent users | 2000-5000 |
| Requests/sec | 500-1000 |
| Error rate | < 0.1% |
| Uptime | 99.9% |
| AI response time | < 3s |

---

## 💰 Cost Estimation

**Monthly costs** (approximate):

### Small Deployment (< 1000 users)
- Server: $20-50/month (VPS)
- Database: $15-30/month
- Domain + SSL: $15/year
- **Total**: ~$50-100/month

### Medium Deployment (1000-10K users)
- Kubernetes cluster: $100-200/month
- Database: $50-100/month
- Redis: $20-40/month
- Load balancer: $20/month
- **Total**: ~$200-400/month

### Large Deployment (10K+ users)
- Kubernetes cluster: $500+/month
- Database (managed): $200+/month
- Redis (managed): $50+/month
- CDN: $50+/month
- **Total**: ~$1000+/month

*Plus AI API costs (variable)*

---

## 🔄 Update & Maintenance

### Regular Updates

**Weekly**:
```bash
# Pull latest changes
git pull origin main

# Rebuild & redeploy
docker-compose -f docker-compose.prod.yml up -d --build
```

**Kubernetes** (automatic via CI/CD):
- Push to main → Auto-deploy

### Database Cleanup

**Monthly tasks**:
```bash
# Clean old sessions
docker exec ai-saas-app npx prisma db execute --stdin <<< "
  DELETE FROM sessions WHERE expires < NOW();
"

# Vacuum database
docker exec postgres vacuumdb -U postgres -d mydb --analyze
```

---

## 🆘 Support

Need help?

1. **Check documentation**: `docs/PRODUCTION_DEPLOYMENT.md`
2. **Common issues**: `docs/TROUBLESHOOTING.md`
3. **GitHub Issues**: Create an issue with logs
4. **Email**: support@yourdomain.com

---

## 🎉 Success!

Your AI SaaS platform is now production-ready with:

✅ **3-tier architecture** (app, database, cache)
✅ **Load balancing** (Nginx/K8s Ingress)
✅ **Auto-scaling** (HPA in Kubernetes)
✅ **Health monitoring** (Built-in endpoints)
✅ **CI/CD pipeline** (GitHub Actions)
✅ **Database migrations** (Automated)
✅ **SSL/TLS** (Let's Encrypt)
✅ **Backups** (Automated daily)
✅ **Provider metrics** (Performance tracking)

**Happy deploying!** 🚀

---

**Last Updated**: January 2025
**Version**: 1.0.0
