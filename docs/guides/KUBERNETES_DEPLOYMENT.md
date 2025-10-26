# 🚀 KUBERNETES DEPLOYMENT GUIDE

**Project**: My-SaaS-Chat
**Phase**: 9 - Kubernetes Orchestration
**Last Updated**: 2025-10-26

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Verification](#verification)
7. [Common Operations](#common-operations)
8. [Troubleshooting](#troubleshooting)
9. [Production Deployment](#production-deployment)

---

## ✅ PREREQUISITES

### Required Tools

1. **kubectl** - Kubernetes CLI
   ```bash
   # Already installed (v1.32.2)
   kubectl version --client
   ```

2. **Local Kubernetes Cluster** (Choose one):
   - **Option A**: Docker Desktop with Kubernetes
     - Enable in: Docker Desktop → Settings → Kubernetes → Enable Kubernetes
   - **Option B**: Minikube
     ```bash
     choco install minikube
     minikube start --cpus=4 --memory=8192
     ```
   - **Option C**: kind (Kubernetes in Docker)
     ```bash
     choco install kind
     kind create cluster --name my-saas-chat
     ```

3. **Docker** - Already installed and running

### Check Cluster Status

```bash
# Verify kubectl can connect
kubectl cluster-info

# Check nodes
kubectl get nodes

# Expected output:
# NAME       STATUS   ROLES    AGE   VERSION
# minikube   Ready    master   1m    v1.28.0
```

---

## 🚀 QUICK START

### 1. Setup Secrets

```bash
# Copy secrets template
cp kubernetes/config/secrets.yaml kubernetes/config/secrets.local.yaml

# Generate AUTH_SECRET
openssl rand -base64 48 | tr -d '\n' | base64

# Edit secrets.local.yaml and replace all REPLACE_WITH_... values
# Add secrets.local.yaml to .gitignore
echo "kubernetes/config/secrets.local.yaml" >> .gitignore
```

### 2. Deploy Everything

```bash
# Create namespace
kubectl apply -f kubernetes/namespaces/production.yaml

# Apply configs
kubectl apply -f kubernetes/config/configmap.yaml
kubectl apply -f kubernetes/config/secrets.local.yaml

# Deploy databases first
kubectl apply -f kubernetes/base/postgres/
kubectl apply -f kubernetes/base/redis/

# Wait for databases
kubectl wait --for=condition=ready pod -l app=postgres -n production --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n production --timeout=300s

# Deploy services
kubectl apply -f kubernetes/base/auth-service/
kubectl apply -f kubernetes/base/chat-service/
kubectl apply -f kubernetes/base/billing-service/
kubectl apply -f kubernetes/base/jaeger/

# Deploy ingress (optional)
kubectl apply -f kubernetes/ingress/ingress.yaml
```

### 3. Verify Deployment

```bash
# Check all pods
kubectl get pods -n production

# Check services
kubectl get svc -n production

# Check HPA (autoscaling)
kubectl get hpa -n production
```

### 4. Access Services

```bash
# Port forward to access locally
kubectl port-forward -n production svc/auth-service 3001:80
kubectl port-forward -n production svc/chat-service 3002:80
kubectl port-forward -n production svc/billing-service 3003:80

# Test
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

---

## 🔧 DETAILED SETUP

### Step 1: Configure Secrets

**Important**: Never commit real secrets to git!

```bash
# 1. Generate AUTH_SECRET (required)
AUTH_SECRET=$(openssl rand -base64 48)
echo -n "$AUTH_SECRET" | base64

# 2. Get your OPENAI_API_KEY
# From: https://platform.openai.com/api-keys
OPENAI_KEY="sk-your-key-here"
echo -n "$OPENAI_KEY" | base64

# 3. Get STRIPE_SECRET_KEY (if you have one)
STRIPE_KEY="sk_test_your-key-here"
echo -n "$STRIPE_KEY" | base64

# 4. Edit secrets.local.yaml
# Replace REPLACE_WITH_BASE64_ENCODED_... with the base64 values above
```

**secrets.local.yaml example**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  AUTH_SECRET: "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo="  # Your generated value
  DATABASE_URL: "cG9zdGdyZXNxbDovL3Bvc3RncmVzOnBvc3RncmVzQHBvc3RncmVzLXNlcnZpY2U6NTQzMi9zYWFzX2Ri"
  POSTGRES_PASSWORD: "cG9zdGdyZXM="
  OPENAI_API_KEY: "c2stWW91ckFjdHVhbE9wZW5BSUtleQ=="  # Your actual key
  STRIPE_SECRET_KEY: "c2tfdGVzdF9Zb3VyU3RyaXBlS2V5"  # Your actual key
  SENTRY_DSN: ""
```

### Step 2: Deploy Infrastructure

```bash
# Create namespace
kubectl apply -f kubernetes/namespaces/production.yaml

# Verify namespace created
kubectl get namespace production

# Apply ConfigMap
kubectl apply -f kubernetes/config/configmap.yaml

# Verify ConfigMap
kubectl describe configmap app-config -n production

# Apply Secrets
kubectl apply -f kubernetes/config/secrets.local.yaml

# Verify Secrets (don't show values!)
kubectl get secrets -n production
```

### Step 3: Deploy Databases

```bash
# Deploy PostgreSQL
kubectl apply -f kubernetes/base/postgres/statefulset.yaml
kubectl apply -f kubernetes/base/postgres/service.yaml

# Deploy Redis
kubectl apply -f kubernetes/base/redis/statefulset.yaml
kubectl apply -f kubernetes/base/redis/service.yaml

# Watch pods starting
kubectl get pods -n production --watch

# Wait for ready status
kubectl wait --for=condition=ready pod -l app=postgres -n production --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n production --timeout=300s

# Check logs if issues
kubectl logs -n production -l app=postgres
kubectl logs -n production -l app=redis
```

### Step 4: Build Docker Images

**Important**: Kubernetes needs Docker images to be available

```bash
# Build all service images
docker build -t auth-service:latest services/auth-service
docker build -t chat-service:latest services/chat-service
docker build -t billing-service:latest services/billing-service

# Verify images
docker images | grep -E "(auth|chat|billing)-service"

# For Minikube, load images into cluster
minikube image load auth-service:latest
minikube image load chat-service:latest
minikube image load billing-service:latest
```

### Step 5: Deploy Microservices

```bash
# Deploy Auth Service
kubectl apply -f kubernetes/base/auth-service/

# Deploy Chat Service
kubectl apply -f kubernetes/base/chat-service/

# Deploy Billing Service
kubectl apply -f kubernetes/base/billing-service/

# Deploy Jaeger
kubectl apply -f kubernetes/base/jaeger/

# Watch deployment progress
kubectl get pods -n production --watch

# Check deployment status
kubectl get deployments -n production
kubectl get pods -n production
kubectl get svc -n production
```

### Step 6: Deploy Ingress (Optional)

```bash
# For Minikube, enable ingress addon
minikube addons enable ingress

# Deploy ingress
kubectl apply -f kubernetes/ingress/ingress.yaml

# Check ingress
kubectl get ingress -n production

# Get ingress IP (for Minikube)
minikube ip

# Add to /etc/hosts (or C:\Windows\System32\drivers\etc\hosts on Windows)
# <minikube-ip> api.mysaas.local
```

---

## ⚙️ CONFIGURATION

### Environment Variables

Edit `kubernetes/config/configmap.yaml` to change:

```yaml
data:
  NODE_ENV: "production"  # or "development", "staging"
  LOG_LEVEL: "info"       # or "debug", "error"

  # Service hosts
  POSTGRES_HOST: "postgres-service"
  REDIS_HOST: "redis-service"

  # Rate limiting
  RATE_LIMIT_WINDOW_MS: "60000"
  RATE_LIMIT_MAX_REQUESTS: "100"
```

### Resource Limits

Edit deployment files to change resources:

```yaml
# In kubernetes/base/auth-service/deployment.yaml
resources:
  requests:
    memory: "256Mi"  # Minimum guaranteed
    cpu: "250m"
  limits:
    memory: "512Mi"  # Maximum allowed
    cpu: "500m"
```

### Auto-Scaling

Edit HPA files to change scaling behavior:

```yaml
# In kubernetes/base/auth-service/hpa.yaml
spec:
  minReplicas: 2   # Minimum pods
  maxReplicas: 10  # Maximum pods

  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70  # Scale up when CPU > 70%
```

---

## 📊 VERIFICATION

### Check All Resources

```bash
# Overview of everything
kubectl get all -n production

# Detailed view
kubectl get pods,svc,deployment,hpa,pvc -n production

# Check resource usage
kubectl top pods -n production
kubectl top nodes
```

### Test Services

```bash
# Port forward each service
kubectl port-forward -n production svc/auth-service 3001:80 &
kubectl port-forward -n production svc/chat-service 3002:80 &
kubectl port-forward -n production svc/billing-service 3003:80 &

# Test health endpoints
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Test API endpoints
curl -X POST http://localhost:3001/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# Kill port forwards
killall kubectl
```

### Check Logs

```bash
# View logs from all pods of a service
kubectl logs -n production -l app=auth-service --tail=100

# Follow logs
kubectl logs -n production -l app=auth-service -f

# Logs from specific pod
kubectl logs -n production auth-service-abc123-xyz

# Previous container logs (if crashed)
kubectl logs -n production auth-service-abc123-xyz --previous
```

### Check Events

```bash
# See recent events
kubectl get events -n production --sort-by='.lastTimestamp'

# Watch events in real-time
kubectl get events -n production --watch
```

---

## 🛠️ COMMON OPERATIONS

### Scaling

```bash
# Manual scaling
kubectl scale deployment auth-service --replicas=5 -n production

# Check current scale
kubectl get deployment auth-service -n production

# View HPA status
kubectl get hpa -n production
```

### Rolling Update

```bash
# Update image
kubectl set image deployment/auth-service auth-service=auth-service:v1.1 -n production

# Watch rollout
kubectl rollout status deployment/auth-service -n production

# Check rollout history
kubectl rollout history deployment/auth-service -n production

# Rollback if needed
kubectl rollout undo deployment/auth-service -n production

# Rollback to specific revision
kubectl rollout undo deployment/auth-service --to-revision=2 -n production
```

### Restart Pods

```bash
# Restart deployment (rolling restart)
kubectl rollout restart deployment/auth-service -n production

# Delete specific pod (will be recreated)
kubectl delete pod auth-service-abc123-xyz -n production

# Force delete if stuck
kubectl delete pod auth-service-abc123-xyz -n production --force --grace-period=0
```

### Debug Pod

```bash
# Execute command in pod
kubectl exec -it auth-service-abc123-xyz -n production -- sh

# Inside pod:
# - Check environment: env | grep -E "(AUTH|DATABASE|REDIS)"
# - Test database: psql $DATABASE_URL
# - Check files: ls -la
# - Test health: curl localhost:3001/health

# Copy files from pod
kubectl cp production/auth-service-abc123-xyz:/app/logs/error.log ./error.log

# Copy files to pod
kubectl cp ./config.json production/auth-service-abc123-xyz:/app/config.json
```

### Update ConfigMap/Secret

```bash
# Edit ConfigMap
kubectl edit configmap app-config -n production

# Or apply changes
kubectl apply -f kubernetes/config/configmap.yaml

# Restart pods to pick up changes
kubectl rollout restart deployment/auth-service -n production
kubectl rollout restart deployment/chat-service -n production
kubectl rollout restart deployment/billing-service -n production
```

---

## 🐛 TROUBLESHOOTING

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n production

# Describe pod for details
kubectl describe pod auth-service-abc123-xyz -n production

# Common issues:
# - ImagePullBackOff: Image not found
#   Fix: Build and load image (see Step 4)
# - CrashLoopBackOff: App crashes on start
#   Fix: Check logs (kubectl logs...)
# - Pending: No resources available
#   Fix: Scale down or add nodes
```

### Service Not Accessible

```bash
# Check service exists
kubectl get svc auth-service -n production

# Check endpoints
kubectl get endpoints auth-service -n production

# If no endpoints, pods not ready
kubectl get pods -n production -l app=auth-service

# Check pod logs
kubectl logs -n production -l app=auth-service --tail=50
```

### Database Connection Issues

```bash
# Check database pod
kubectl get pod -n production -l app=postgres

# Check database service
kubectl get svc postgres-service -n production

# Test connection from service pod
kubectl exec -it auth-service-abc123-xyz -n production -- sh
# Inside: ping postgres-service
# Inside: nc -zv postgres-service 5432

# Check database logs
kubectl logs -n production -l app=postgres --tail=100
```

### Out of Memory / CPU

```bash
# Check resource usage
kubectl top pods -n production
kubectl top nodes

# If OOM killed, increase limits
# Edit deployment.yaml and increase:
resources:
  limits:
    memory: "1Gi"  # Increase from 512Mi

# Apply changes
kubectl apply -f kubernetes/base/auth-service/deployment.yaml
```

### Ingress Not Working

```bash
# Check ingress controller is running
kubectl get pods -n ingress-nginx

# For Minikube:
minikube addons list | grep ingress

# Check ingress resource
kubectl describe ingress my-saas-ingress -n production

# Test from inside cluster
kubectl run test-pod --rm -it --image=busybox -- sh
# Inside: wget -O- http://auth-service.production.svc.cluster.local
```

---

## 🌐 PRODUCTION DEPLOYMENT

### Cloud Providers

#### Google Kubernetes Engine (GKE)

```bash
# Create cluster
gcloud container clusters create my-saas-chat \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --zone=us-central1-a

# Get credentials
gcloud container clusters get-credentials my-saas-chat

# Deploy
kubectl apply -f kubernetes/namespaces/production.yaml
kubectl apply -f kubernetes/config/
kubectl apply -f kubernetes/base/
kubectl apply -f kubernetes/ingress/
```

#### Amazon EKS

```bash
# Create cluster (via eksctl)
eksctl create cluster \
  --name my-saas-chat \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3

# Deploy (same as GKE)
```

#### Azure AKS

```bash
# Create cluster
az aks create \
  --resource-group my-resource-group \
  --name my-saas-chat \
  --node-count 3 \
  --node-vm-size Standard_D2s_v3

# Get credentials
az aks get-credentials --resource-group my-resource-group --name my-saas-chat

# Deploy (same as GKE)
```

### Production Checklist

- [ ] Use proper secrets management (e.g., Sealed Secrets, External Secrets)
- [ ] Configure SSL/TLS certificates
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure log aggregation (ELK/Loki)
- [ ] Set up backups for databases
- [ ] Configure auto-scaling (HPA + Cluster Autoscaler)
- [ ] Set up CI/CD pipeline
- [ ] Configure resource quotas
- [ ] Enable network policies
- [ ] Set up disaster recovery

---

## 📝 USEFUL COMMANDS

```bash
# Get all resources in namespace
kubectl get all -n production

# Delete all resources in namespace
kubectl delete namespace production

# Apply all manifests in directory
kubectl apply -f kubernetes/base/ -R

# Dry-run (validate without applying)
kubectl apply -f deployment.yaml --dry-run=client

# Explain resource fields
kubectl explain deployment.spec.template.spec.containers

# Port forward multiple services
for svc in auth-service chat-service billing-service; do
  kubectl port-forward -n production svc/$svc $(echo $svc | grep -o '[0-9]*'):80 &
done

# Kill all port forwards
killall kubectl
```

---

## 🎯 NEXT STEPS

After successful deployment:

1. **Monitor Performance**
   - Set up Grafana dashboards
   - Configure alerts

2. **Optimize Resources**
   - Adjust CPU/memory based on usage
   - Fine-tune auto-scaling

3. **Enhance Security**
   - Implement network policies
   - Use Pod Security Policies

4. **Improve CI/CD**
   - Automate deployments
   - Add smoke tests

5. **Plan for Scale**
   - Multi-region deployment
   - Database replication
   - CDN integration

---

**Congratulations! Your application is now running on Kubernetes!** 🎉

For questions or issues, refer to:
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- Project documentation in `docs/`

**Last Updated**: 2025-10-26
