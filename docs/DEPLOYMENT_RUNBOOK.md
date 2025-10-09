# Deployment Runbook v1.0.0-beta

Complete step-by-step deployment guide for AI SaaS Platform production deployment.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Option A: CI/CD with GitHub Actions](#option-a-cicd-with-github-actions)
3. [Option B: Docker Compose Production](#option-b-docker-compose-production)
4. [Option C: Kubernetes Deployment](#option-c-kubernetes-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring Setup](#monitoring-setup)
7. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Complete these steps **BEFORE** deploying to any environment.

### 1. Environment Preparation

- [ ] Create `.env.production` file (do NOT commit!)
- [ ] Set all required environment variables (see [`ENVIRONMENT_VARS.md`](./ENVIRONMENT_VARS.md))
- [ ] Generate secure `AUTH_SECRET` (32+ characters):
  ```bash
  openssl rand -base64 32
  ```
- [ ] Obtain AI provider API keys (at least ONE required):
  - [ ] OpenAI API key
  - [ ] Anthropic API key
  - [ ] Google/Gemini API key
- [ ] Configure database:
  - [ ] PostgreSQL instance ready
  - [ ] DATABASE_URL with connection pooling parameters
- [ ] Configure email (if `REQUIRE_EMAIL_VERIFICATION=true`):
  - [ ] SMTP credentials
  - [ ] Test email sending
- [ ] Configure monitoring:
  - [ ] Sentry DSN
  - [ ] Redis URL (optional but recommended)

### 2. Code Preparation

- [ ] All tests passing: `npm run test`
- [ ] Type check passing: `npm run type-check`
- [ ] Linting clean: `npm run lint`
- [ ] Environment verification: `npm run env:verify:strict`
- [ ] Build succeeds: `npm run build`
- [ ] Database migrations up to date: `npm run db:migrate`

### 3. Infrastructure Preparation

- [ ] Domain/subdomain registered and DNS configured
- [ ] SSL/TLS certificate ready (Let's Encrypt or provider certificate)
- [ ] Database backup taken
- [ ] Monitoring dashboards configured
- [ ] Alert channels set up (Slack, email, PagerDuty, etc.)

### 4. Security Verification

- [ ] No secrets in version control: `git secrets --scan`
- [ ] `.env.production` in `.gitignore`
- [ ] All `DEV_BYPASS_*` flags set to `false` or removed
- [ ] `MOCK_AI` set to `false` or removed
- [ ] `NODE_ENV=production`
- [ ] HTTPS enabled for production domain
- [ ] Security headers enabled (automatic in middleware)
- [ ] Rate limiting enabled (automatic in middleware)

---

## Option A: CI/CD with GitHub Actions

**Recommended for**: Teams with CI/CD pipelines, automated testing, and version control workflows.

### Architecture

```
GitHub Push → GitHub Actions → Docker Build → Registry Push → Deploy
```

### Prerequisites

- GitHub repository
- Container registry (GitHub Container Registry, Docker Hub, AWS ECR, etc.)
- Deployment target (server with Docker, Kubernetes cluster, or cloud platform)
- GitHub Secrets configured

### Step 1: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - JWT signing secret (32+ chars)
- `NEXT_PUBLIC_APP_URL` - Your production domain
- `OPENAI_API_KEY` (or other AI provider key)

**Recommended:**
- `REDIS_URL` - Upstash/Redis connection URL
- `REDIS_TOKEN` - Redis authentication token
- `SENTRY_DSN` - Error tracking
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

**Payment (if applicable):**
- `PAYOS_CLIENT_ID`
- `PAYOS_API_KEY`
- `PAYOS_CHECKSUM_KEY`

**Deployment:**
- `DOCKER_REGISTRY` - e.g., `ghcr.io`
- `DOCKER_USERNAME` - Registry username
- `DOCKER_PASSWORD` - Registry password/token
- `SSH_PRIVATE_KEY` - For remote deployment (if using SSH)
- `SERVER_HOST` - Production server IP/domain
- `SERVER_USER` - SSH username

### Step 2: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags:
      - 'v*'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NODE_ENV=production
            NEXT_PUBLIC_APP_URL=${{ secrets.NEXT_PUBLIC_APP_URL }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to production server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/ai-saas-app
            docker compose pull
            docker compose up -d
            docker system prune -f
```

### Step 3: Deploy

1. **Tag a release:**
   ```bash
   git tag -a v1.0.0-beta -m "Beta release"
   git push origin v1.0.0-beta
   ```

2. **Monitor GitHub Actions:**
   - Go to Actions tab in GitHub
   - Watch build and deployment progress
   - Check logs for any errors

3. **Verify deployment:**
   - Check application health: `https://yourdomain.com/api/health`
   - Monitor logs: `docker compose logs -f`

### Rollback CI/CD Deployment

```bash
# SSH to production server
ssh user@server

# View previous images
docker images | grep ai-saas

# Rollback to previous version
cd /opt/ai-saas-app
docker compose down
docker tag ghcr.io/org/repo:v1.0.0-beta ghcr.io/org/repo:latest
docker compose up -d
```

---

## Option B: Docker Compose Production

**Recommended for**: Single-server deployments, small to medium applications, teams familiar with Docker.

### Architecture

```
[Nginx] → [Next.js App] → [PostgreSQL]
           └─→ [Redis]
```

### Prerequisites

- Server with Docker and Docker Compose installed
- Domain pointing to server IP
- SSL certificate (can use Nginx + Let's Encrypt)

### Step 1: Update `docker-compose.prod.yml`

Create `docker-compose.prod.yml` in project root:

```yaml
version: '3.9'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    container_name: ai-saas-web
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - AUTH_SECRET=${AUTH_SECRET}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - REDIS_URL=${REDIS_URL}
      - REDIS_TOKEN=${REDIS_TOKEN}
      - SENTRY_DSN=${SENTRY_DSN}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASS=${SMTP_PASS}
      - SMTP_FROM=${SMTP_FROM}
      - PAYOS_CLIENT_ID=${PAYOS_CLIENT_ID}
      - PAYOS_API_KEY=${PAYOS_API_KEY}
      - PAYOS_CHECKSUM_KEY=${PAYOS_CHECKSUM_KEY}
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:16-alpine
    container_name: ai-saas-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-ai_saas}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ai-saas-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  nginx:
    image: nginx:alpine
    container_name: ai-saas-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - web

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: ai-saas-network
```

### Step 2: Create Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server web:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=100r/m;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers (defense in depth - app also sets these)
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

        # Client body size
        client_max_body_size 10M;

        # Proxy settings
        location / {
            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # API rate limiting
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;

            proxy_pass http://nextjs;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check endpoint (no rate limit)
        location /api/health {
            proxy_pass http://nextjs;
        }

        # Static files cache
        location /_next/static/ {
            proxy_pass http://nextjs;
            proxy_cache_valid 200 7d;
            add_header Cache-Control "public, max-age=604800, immutable";
        }

        # Access logs
        access_log /var/log/nginx/access.log combined;
        error_log /var/log/nginx/error.log warn;
    }
}
```

### Step 3: Deploy

```bash
# 1. Copy files to server
scp -r . user@server:/opt/ai-saas-app/

# 2. SSH to server
ssh user@server

# 3. Navigate to app directory
cd /opt/ai-saas-app

# 4. Set environment variables
nano .env.production  # Or use secret management

# 5. Build and start services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 6. Run database migrations
docker compose -f docker-compose.prod.yml exec web npm run db:migrate:prod

# 7. Check logs
docker compose -f docker-compose.prod.yml logs -f

# 8. Verify health
curl https://yourdomain.com/api/health
```

### Maintenance Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker compose -f docker-compose.prod.yml restart web

# Stop all services
docker compose -f docker-compose.prod.yml down

# Update and redeploy
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Database backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U postgres ai_saas > backup.sql

# Database restore
docker compose -f docker-compose.prod.yml exec -T db psql -U postgres ai_saas < backup.sql

# Clean up
docker system prune -a -f
```

### Rollback Docker Compose

```bash
# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout v1.0.0-beta  # or previous commit

# Rebuild and deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# If database migration needs rollback
docker compose -f docker-compose.prod.yml exec web npm run db:migrate:reset
# Then restore from backup
docker compose -f docker-compose.prod.yml exec -T db psql -U postgres ai_saas < backup.sql
```

---

## Option C: Kubernetes Deployment

**Recommended for**: Large-scale deployments, teams with Kubernetes expertise, high-availability requirements.

### Architecture

```
[Ingress/LoadBalancer] → [Next.js Pods x N] → [External PostgreSQL]
                              └─→ [Redis Cluster]
```

### Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or self-hosted)
- `kubectl` configured
- Container registry
- External PostgreSQL and Redis (or deploy with StatefulSets)

### Step 1: Create Kubernetes Manifests

Create `k8s/namespace.yaml`:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-saas-prod
```

Create `k8s/secrets.yaml`:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-saas-secrets
  namespace: ai-saas-prod
type: Opaque
stringData:
  DATABASE_URL: "postgresql://..."
  AUTH_SECRET: "..."
  OPENAI_API_KEY: "..."
  ANTHROPIC_API_KEY: "..."
  REDIS_URL: "..."
  REDIS_TOKEN: "..."
  SENTRY_DSN: "..."
  SMTP_HOST: "..."
  SMTP_PORT: "587"
  SMTP_USER: "..."
  SMTP_PASS: "..."
  SMTP_FROM: "..."
  PAYOS_CLIENT_ID: "..."
  PAYOS_API_KEY: "..."
  PAYOS_CHECKSUM_KEY: "..."
```

Create `k8s/configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-saas-config
  namespace: ai-saas-prod
data:
  NODE_ENV: "production"
  NEXT_PUBLIC_APP_URL: "https://yourdomain.com"
  ENABLE_PERFORMANCE_MONITORING: "true"
  LOG_LEVEL: "info"
```

Create `k8s/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-saas-web
  namespace: ai-saas-prod
  labels:
    app: ai-saas
    tier: web
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-saas
      tier: web
  template:
    metadata:
      labels:
        app: ai-saas
        tier: web
    spec:
      containers:
      - name: web
        image: ghcr.io/your-org/ai-saas:v1.0.0-beta
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        envFrom:
        - configMapRef:
            name: ai-saas-config
        - secretRef:
            name: ai-saas-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
      imagePullSecrets:
      - name: ghcr-secret
```

Create `k8s/service.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-saas-web
  namespace: ai-saas-prod
spec:
  type: ClusterIP
  selector:
    app: ai-saas
    tier: web
  ports:
  - port: 80
    targetPort: 3000
    name: http
```

Create `k8s/ingress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-saas-ingress
  namespace: ai-saas-prod
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - yourdomain.com
    secretName: ai-saas-tls
  rules:
  - host: yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-saas-web
            port:
              number: 80
```

Create `k8s/hpa.yaml` (Horizontal Pod Autoscaler):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-saas-hpa
  namespace: ai-saas-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-saas-web
  minReplicas: 2
  maxReplicas: 8
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 2
        periodSeconds: 15
      selectPolicy: Max
```

### Step 2: Deploy to Kubernetes

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets (use kubectl create secret or external secret manager)
kubectl create secret generic ai-saas-secrets \
  --from-env-file=.env.production \
  --namespace=ai-saas-prod

# 3. Create ConfigMap
kubectl apply -f k8s/configmap.yaml

# 4. Deploy application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# 5. Check deployment status
kubectl rollout status deployment/ai-saas-web -n ai-saas-prod

# 6. Get pods
kubectl get pods -n ai-saas-prod

# 7. Check logs
kubectl logs -f deployment/ai-saas-web -n ai-saas-prod

# 8. Run database migration (one-time job)
kubectl run migration \
  --image=ghcr.io/your-org/ai-saas:v1.0.0-beta \
  --restart=Never \
  --namespace=ai-saas-prod \
  --command -- npm run db:migrate:prod
```

### Maintenance Commands

```bash
# View logs
kubectl logs -f deployment/ai-saas-web -n ai-saas-prod

# Scale manually
kubectl scale deployment ai-saas-web --replicas=5 -n ai-saas-prod

# Update image
kubectl set image deployment/ai-saas-web web=ghcr.io/your-org/ai-saas:v1.0.1-beta -n ai-saas-prod

# Restart deployment
kubectl rollout restart deployment/ai-saas-web -n ai-saas-prod

# Port forward for debugging
kubectl port-forward deployment/ai-saas-web 3000:3000 -n ai-saas-prod

# Execute command in pod
kubectl exec -it deployment/ai-saas-web -n ai-saas-prod -- /bin/sh

# View HPA status
kubectl get hpa -n ai-saas-prod

# Describe pod for debugging
kubectl describe pod <pod-name> -n ai-saas-prod
```

### Rollback Kubernetes

```bash
# View rollout history
kubectl rollout history deployment/ai-saas-web -n ai-saas-prod

# Rollback to previous version
kubectl rollout undo deployment/ai-saas-web -n ai-saas-prod

# Rollback to specific revision
kubectl rollout undo deployment/ai-saas-web --to-revision=2 -n ai-saas-prod

# Verify rollback
kubectl rollout status deployment/ai-saas-web -n ai-saas-prod
```

---

## Post-Deployment Verification

After deployment completes, verify all critical functionality:

### 1. Health Checks

```bash
# Basic health
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"...","version":"1.0.0-beta"}

# Metrics health
curl https://yourdomain.com/api/metrics/health

# Provider health
curl https://yourdomain.com/api/providers/health
```

### 2. Authentication Flow

```bash
# Test signup
curl -X POST https://yourdomain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'

# Test signin
curl -X POST https://yourdomain.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'

# Test refresh
curl -X POST https://yourdomain.com/api/auth/refresh \
  -H "Cookie: session=<token>"
```

### 3. Security Verification

```bash
# CSRF protection (should fail without token)
curl -X POST https://yourdomain.com/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Expected: 403 Forbidden

# Rate limiting (send 101 requests rapidly)
for i in {1..101}; do
  curl https://yourdomain.com/api/health
done

# Expected: 429 Too Many Requests on request 101
```

### 4. Core Functionality

See [`POST_DEPLOY_CHECKLIST.md`](./POST_DEPLOY_CHECKLIST.md) for comprehensive testing checklist.

---

## Monitoring Setup

### Sentry Configuration

Verify Sentry is receiving events:

1. Trigger test error:
   ```bash
   curl https://yourdomain.com/api/test-error
   ```

2. Check Sentry dashboard for error report

### Metrics Dashboard

Access metrics endpoints:

```bash
# Dashboard metrics
curl https://yourdomain.com/api/metrics/dashboard?hoursBack=24

# Alerts
curl https://yourdomain.com/api/metrics/alerts

# Cost breakdown
curl https://yourdomain.com/api/metrics/cost-breakdown
```

### Application Logs

**Docker Compose:**
```bash
docker compose -f docker-compose.prod.yml logs -f --tail=100
```

**Kubernetes:**
```bash
kubectl logs -f deployment/ai-saas-web -n ai-saas-prod --tail=100
```

---

## Troubleshooting

### Issue: Application won't start

**Symptoms:** Container/pod crashes immediately

**Solutions:**
1. Check environment variables:
   ```bash
   npm run env:verify:strict
   ```

2. Check database connectivity:
   ```bash
   # Docker
   docker compose exec web npx prisma db push --accept-data-loss

   # Kubernetes
   kubectl exec -it deployment/ai-saas-web -n ai-saas-prod -- npx prisma db push
   ```

3. Check logs for specific error:
   ```bash
   # Docker
   docker compose logs web | grep -i error

   # Kubernetes
   kubectl logs deployment/ai-saas-web -n ai-saas-prod | grep -i error
   ```

### Issue: Database connection errors

**Symptoms:** "Can't reach database server" errors

**Solutions:**
1. Verify DATABASE_URL format:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&connection_limit=10
   ```

2. Check network connectivity:
   ```bash
   # Docker
   docker compose exec web ping db

   # Kubernetes
   kubectl exec -it deployment/ai-saas-web -n ai-saas-prod -- ping <db-host>
   ```

3. Verify database is running:
   ```bash
   # Docker
   docker compose ps db

   # External
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Issue: AI provider errors

**Symptoms:** Chat requests failing with "AI provider unavailable"

**Solutions:**
1. Verify API keys are set:
   ```bash
   npm run env:verify
   ```

2. Test API key directly:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. Check provider health:
   ```bash
   curl https://yourdomain.com/api/metrics/health
   ```

### Issue: 500 errors on all requests

**Symptoms:** All requests return 500 Internal Server Error

**Solutions:**
1. Check if build completed successfully:
   ```bash
   # Look for .next/BUILD_ID file
   docker compose exec web ls -la .next/BUILD_ID
   ```

2. Check Node.js version compatibility:
   ```bash
   docker compose exec web node --version
   # Should be v18 or v20
   ```

3. Rebuild from scratch:
   ```bash
   docker compose down -v
   docker compose build --no-cache
   docker compose up -d
   ```

### Issue: Rate limiting not working

**Symptoms:** Can exceed rate limits

**Solutions:**
1. Verify middleware is loaded
2. Check Redis connection (if using Redis backend)
3. Restart application to reinitialize limiters

---

## Next Steps

- Complete [Post-Deployment Checklist](./POST_DEPLOY_CHECKLIST.md)
- Set up [Beta War Room Monitoring](./BETA_WARROOM_LOG.md)
- Review [Rollback Procedures](./ROLLBACK.md)
- Configure alerts and notifications

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0-beta
**Maintainer**: DevOps Team
