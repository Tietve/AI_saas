# Kubernetes Deployment Guide - My-SaaS-Chat

Complete guide for deploying My-SaaS-Chat microservices to Kubernetes.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Local Testing)](#quick-start-local-testing)
3. [Production Deployment](#production-deployment)
4. [Configuration](#configuration)
5. [Scaling](#scaling)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Uninstall](#uninstall)

---

## 🔧 Prerequisites

### Required Tools

**Install kubectl** (Kubernetes CLI):
```bash
# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# macOS (Homebrew)
brew install kubectl

# Windows (Chocolatey)
choco install kubernetes-cli

# Verify
kubectl version --client
```

### Local Kubernetes Cluster (Choose One)

**Option 1: Minikube** (Recommended for beginners)
```bash
# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# macOS
brew install minikube

# Windows
choco install minikube

# Start cluster
minikube start --cpus=4 --memory=8192 --driver=docker

# Enable addons
minikube addons enable ingress
minikube addons enable metrics-server
```

**Option 2: Kind** (Kubernetes in Docker)
```bash
# Install Kind
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Create cluster
kind create cluster --name my-saas-chat

# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

**Option 3: Docker Desktop** (Windows/macOS)
- Enable Kubernetes in Docker Desktop settings
- Wait for Kubernetes to start (green indicator)

---

## 🚀 Quick Start (Local Testing)

### Step 1: Build Docker Images

First, build the Docker images for your services:

```bash
# From project root
cd services/auth-service
docker build -t my-saas-chat/auth-service:latest .

cd ../chat-service
docker build -t my-saas-chat/chat-service:latest .

cd ../billing-service
docker build -t my-saas-chat/billing-service:latest .

cd ../..
```

**For Minikube**: Load images into Minikube
```bash
minikube image load my-saas-chat/auth-service:latest
minikube image load my-saas-chat/chat-service:latest
minikube image load my-saas-chat/billing-service:latest
```

**For Kind**: Load images into Kind
```bash
kind load docker-image my-saas-chat/auth-service:latest --name my-saas-chat
kind load docker-image my-saas-chat/chat-service:latest --name my-saas-chat
kind load docker-image my-saas-chat/billing-service:latest --name my-saas-chat
```

---

### Step 2: Create Namespace

```bash
kubectl apply -f k8s/namespace/namespace.yaml

# Set as default namespace (optional)
kubectl config set-context --current --namespace=my-saas-chat
```

---

### Step 3: Create Secrets

**Using the automated script**:
```bash
cd k8s/secrets

# Set required environment variables
export AUTH_SECRET=$(openssl rand -base64 48)
export OPENAI_API_KEY="sk-your-openai-key-here"
export STRIPE_SECRET_KEY="sk_test_your-stripe-key"
export POSTGRES_PASSWORD=$(openssl rand -base64 32)

# Run script
chmod +x create-secrets.sh
./create-secrets.sh

cd ../..
```

**Or manually**:
```bash
# Auth secret
kubectl create secret generic auth-secret \
  --from-literal=AUTH_SECRET="$(openssl rand -base64 48)" \
  -n my-saas-chat

# Database credentials
kubectl create secret generic database-secret \
  --from-literal=POSTGRES_USER=postgres \
  --from-literal=POSTGRES_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=MONGO_INITDB_ROOT_USERNAME=admin \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD="$(openssl rand -base64 32)" \
  -n my-saas-chat

# API keys
kubectl create secret generic api-keys-secret \
  --from-literal=OPENAI_API_KEY="sk-your-key" \
  --from-literal=STRIPE_SECRET_KEY="sk_test_your-key" \
  --from-literal=ANTHROPIC_API_KEY="" \
  --from-literal=GOOGLE_API_KEY="" \
  --from-literal=GROQ_API_KEY="" \
  --from-literal=STRIPE_WEBHOOK_SECRET="" \
  --from-literal=SENTRY_DSN="" \
  -n my-saas-chat
```

---

### Step 4: Create ConfigMaps

```bash
kubectl apply -f k8s/configmaps/
```

---

### Step 5: Deploy Infrastructure

**PostgreSQL**:
```bash
kubectl apply -f k8s/infrastructure/postgres/
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s -n my-saas-chat
```

**Redis**:
```bash
kubectl apply -f k8s/infrastructure/redis/
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s -n my-saas-chat
```

**Jaeger**:
```bash
kubectl apply -f k8s/infrastructure/jaeger/
kubectl wait --for=condition=ready pod -l app=jaeger --timeout=300s -n my-saas-chat
```

**Check infrastructure status**:
```bash
kubectl get pods -n my-saas-chat
```

Expected output:
```
NAME          READY   STATUS    RESTARTS   AGE
postgres-0    1/1     Running   0          2m
redis-xxx     1/1     Running   0          2m
jaeger-xxx    1/1     Running   0          2m
```

---

### Step 6: Deploy Services

**Deploy all services**:
```bash
# Auth Service
kubectl apply -f k8s/services/auth-service/

# Chat Service
kubectl apply -f k8s/services/chat-service/

# Billing Service
kubectl apply -f k8s/services/billing-service/
```

**Wait for services to be ready**:
```bash
kubectl wait --for=condition=ready pod -l app=auth-service --timeout=300s -n my-saas-chat
kubectl wait --for=condition=ready pod -l app=chat-service --timeout=300s -n my-saas-chat
kubectl wait --for=condition=ready pod -l app=billing-service --timeout=300s -n my-saas-chat
```

**Check services**:
```bash
kubectl get pods -n my-saas-chat
kubectl get svc -n my-saas-chat
```

---

### Step 7: Deploy Ingress (Optional)

```bash
kubectl apply -f k8s/ingress/ingress.yaml

# Check ingress
kubectl get ingress -n my-saas-chat
```

For local testing, add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 api.my-saas-chat.com
127.0.0.1 jaeger.my-saas-chat.com
```

Get Minikube IP (if using Minikube):
```bash
minikube ip
# Use this IP instead of 127.0.0.1 in /etc/hosts
```

---

### Step 8: Test Deployment

**Port-forward for direct access**:
```bash
# Auth Service
kubectl port-forward svc/auth-service 3001:3001 -n my-saas-chat &

# Chat Service
kubectl port-forward svc/chat-service 3002:3002 -n my-saas-chat &

# Billing Service
kubectl port-forward svc/billing-service 3003:3003 -n my-saas-chat &

# Jaeger UI
kubectl port-forward svc/jaeger-service 16686:16686 -n my-saas-chat &
```

**Test endpoints**:
```bash
# Auth health check
curl http://localhost:3001/health

# Chat health check
curl http://localhost:3002/health

# Billing health check
curl http://localhost:3003/health

# Jaeger UI
open http://localhost:16686
```

**Test signup**:
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

---

## 🏭 Production Deployment

### Differences from Local

1. **Docker Registry**: Push images to a registry (Docker Hub, GCR, ECR, ACR)
2. **Persistent Volumes**: Use production storage classes
3. **TLS/SSL**: Enable HTTPS with certificates
4. **Secrets Management**: Use external secret managers
5. **Monitoring**: Deploy Prometheus + Grafana
6. **Autoscaling**: Enable HPA based on metrics

### Push Images to Registry

```bash
# Tag images
docker tag my-saas-chat/auth-service:latest yourdockerhub/my-saas-auth:v1.0.0
docker tag my-saas-chat/chat-service:latest yourdockerhub/my-saas-chat:v1.0.0
docker tag my-saas-chat/billing-service:latest yourdockerhub/my-saas-billing:v1.0.0

# Push to registry
docker push yourdockerhub/my-saas-auth:v1.0.0
docker push yourdockerhub/my-saas-chat:v1.0.0
docker push yourdockerhub/my-saas-billing:v1.0.0

# Update image references in deployment files
# Change imagePullPolicy: IfNotPresent to Always
```

### Enable TLS

1. **Get SSL certificate** (Let's Encrypt, CloudFlare, etc.)

2. **Create TLS secret**:
```bash
kubectl create secret tls tls-secret \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n my-saas-chat
```

3. **Uncomment TLS section** in `k8s/ingress/ingress.yaml`

### Production Checklist

- [ ] Images pushed to production registry
- [ ] All secrets created securely
- [ ] TLS certificates configured
- [ ] Resource limits reviewed and adjusted
- [ ] HPA configured and tested
- [ ] Monitoring stack deployed
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] Load testing completed
- [ ] Security audit passed

---

## ⚙️ Configuration

### Updating ConfigMaps

```bash
# Edit configmap
kubectl edit configmap app-config -n my-saas-chat

# Or apply changes
kubectl apply -f k8s/configmaps/app-config.yaml

# Restart pods to pick up changes
kubectl rollout restart deployment/auth-service -n my-saas-chat
kubectl rollout restart deployment/chat-service -n my-saas-chat
kubectl rollout restart deployment/billing-service -n my-saas-chat
```

### Updating Secrets

```bash
# Update secret
kubectl create secret generic auth-secret \
  --from-literal=AUTH_SECRET="new-secret" \
  -n my-saas-chat \
  --dry-run=client -o yaml | kubectl apply -f -

# Restart pods
kubectl rollout restart deployment/auth-service -n my-saas-chat
```

---

## 📈 Scaling

### Manual Scaling

```bash
# Scale auth service to 5 replicas
kubectl scale deployment auth-service --replicas=5 -n my-saas-chat

# Scale chat service to 10 replicas
kubectl scale deployment chat-service --replicas=10 -n my-saas-chat
```

### Horizontal Pod Autoscaler (HPA)

**Enable metrics server** (if not already):
```bash
# Minikube
minikube addons enable metrics-server

# Other clusters
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**Deploy HPA**:
```bash
# Already included in service manifests, but to apply separately:
kubectl apply -f k8s/services/auth-service/hpa.yaml
kubectl apply -f k8s/services/chat-service/hpa.yaml
kubectl apply -f k8s/services/billing-service/hpa.yaml
```

**Check HPA status**:
```bash
kubectl get hpa -n my-saas-chat

# Watch autoscaling in action
kubectl get hpa -n my-saas-chat --watch
```

**Generate load for testing**:
```bash
# Install hey (HTTP load generator)
go install github.com/rakyll/hey@latest

# Generate load
hey -z 5m -c 50 http://localhost:3001/api/auth/me
```

---

## 📊 Monitoring

### View Logs

```bash
# View logs for specific service
kubectl logs -f deployment/auth-service -n my-saas-chat

# View logs for all pods with label
kubectl logs -f -l app=auth-service -n my-saas-chat

# Previous logs (if pod restarted)
kubectl logs --previous deployment/auth-service -n my-saas-chat

# Stern (better log viewing)
brew install stern
stern auth-service -n my-saas-chat
```

### Pod Status

```bash
# Get all pods
kubectl get pods -n my-saas-chat

# Describe pod (detailed info)
kubectl describe pod <pod-name> -n my-saas-chat

# Get pod metrics
kubectl top pods -n my-saas-chat

# Get node metrics
kubectl top nodes
```

### Events

```bash
# View events
kubectl get events -n my-saas-chat --sort-by='.lastTimestamp'
```

### Jaeger UI

```bash
# Port-forward Jaeger UI
kubectl port-forward svc/jaeger-service 16686:16686 -n my-saas-chat

# Access at http://localhost:16686
```

---

## 🐛 Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl get pods -n my-saas-chat

# Describe pod for events
kubectl describe pod <pod-name> -n my-saas-chat

# Check logs
kubectl logs <pod-name> -n my-saas-chat

# Common issues:
# - ImagePullBackOff: Image not found or pull error
# - CrashLoopBackOff: Application crashing on startup
# - Pending: Insufficient resources or PVC issues
```

### Service Not Accessible

```bash
# Check service
kubectl get svc -n my-saas-chat

# Test service from within cluster
kubectl run test --rm -it --image=busybox -n my-saas-chat -- sh
# Inside pod:
wget -O- http://auth-service:3001/health

# Check endpoints
kubectl get endpoints auth-service -n my-saas-chat
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl logs -f postgres-0 -n my-saas-chat

# Test connection from auth service pod
kubectl exec -it deployment/auth-service -n my-saas-chat -- sh
# Inside pod:
apt-get update && apt-get install -y postgresql-client
psql postgresql://postgres:$POSTGRES_PASSWORD@postgres-service:5432/saas_db
```

### Ingress Not Working

```bash
# Check ingress
kubectl get ingress -n my-saas-chat
kubectl describe ingress my-saas-ingress -n my-saas-chat

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# For Minikube
minikube tunnel  # Run in separate terminal
```

### Secrets Not Found

```bash
# List secrets
kubectl get secrets -n my-saas-chat

# View secret (base64 encoded)
kubectl get secret auth-secret -n my-saas-chat -o yaml

# Decode secret
kubectl get secret auth-secret -n my-saas-chat -o jsonpath='{.data.AUTH_SECRET}' | base64 --decode
```

---

## 🗑️ Uninstall

### Delete Everything

```bash
# Delete all resources in namespace
kubectl delete namespace my-saas-chat

# This will delete:
# - All deployments
# - All services
# - All pods
# - All secrets
# - All configmaps
# - All PVCs (and associated data!)
```

### Delete Specific Resources

```bash
# Delete services only
kubectl delete -f k8s/services/ -n my-saas-chat

# Delete infrastructure only
kubectl delete -f k8s/infrastructure/ -n my-saas-chat

# Delete ingress
kubectl delete -f k8s/ingress/ -n my-saas-chat
```

### Stop Local Cluster

```bash
# Minikube
minikube stop
minikube delete

# Kind
kind delete cluster --name my-saas-chat

# Docker Desktop
# Disable Kubernetes in settings
```

---

## 📚 Additional Resources

- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [Kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Horizontal Pod Autoscaler](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

---

## 🆘 Getting Help

**View service documentation**:
- Auth Service API: http://localhost:3001/api-docs (when port-forwarded)
- Project docs: `../docs/`

**Common Commands**:
```bash
# Get everything in namespace
kubectl get all -n my-saas-chat

# Quick health check
kubectl get pods -n my-saas-chat | grep -v Running

# Restart all services
kubectl rollout restart deployment -n my-saas-chat

# Delete and redeploy
kubectl delete -f k8s/ && kubectl apply -f k8s/
```

---

**Generated**: 2025-10-27
**Kubernetes Version**: 1.28+
**Status**: Production Ready

Happy Kubernetes deployment! ⛵☁️
