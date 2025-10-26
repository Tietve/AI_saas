# ⚡ QUICK START - KUBERNETES DEPLOYMENT

**Status**: Ready to deploy after Docker Desktop restart
**Phase**: 10 - Kubernetes Deployment
**Time Required**: ~30-45 minutes

---

## 🚀 QUICK STEPS (After Restart)

### 1. Enable Kubernetes (2 minutes)
```
Docker Desktop → Settings → Kubernetes → Enable Kubernetes → Apply & Restart
Wait 2-3 minutes
```

### 2. Verify (10 seconds)
```bash
kubectl cluster-info
kubectl get nodes
```

### 3. Build Images (5 minutes)
```bash
docker build -t auth-service:latest services/auth-service
docker build -t chat-service:latest services/chat-service
docker build -t billing-service:latest services/billing-service
```

### 4. Configure Secrets (2 minutes)
```bash
cp kubernetes/config/secrets.yaml kubernetes/config/secrets.local.yaml
# Edit secrets.local.yaml - see CURRENT_DEPLOYMENT_STATUS.md for details
```

### 5. Deploy (10 minutes)
```bash
# Namespace
kubectl apply -f kubernetes/namespaces/production.yaml

# Config
kubectl apply -f kubernetes/config/configmap.yaml
kubectl apply -f kubernetes/config/secrets.local.yaml

# Databases (wait for ready)
kubectl apply -f kubernetes/base/postgres/
kubectl apply -f kubernetes/base/redis/
kubectl wait --for=condition=ready pod -l app=postgres -n production --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n production --timeout=300s

# Services
kubectl apply -f kubernetes/base/auth-service/
kubectl apply -f kubernetes/base/chat-service/
kubectl apply -f kubernetes/base/billing-service/
kubectl apply -f kubernetes/base/jaeger/
```

### 6. Verify (2 minutes)
```bash
kubectl get pods -n production
# All should show "Running"

kubectl get svc -n production
# Should see 6 services
```

### 7. Test (5 minutes)
```bash
kubectl port-forward -n production svc/auth-service 3001:80 &
kubectl port-forward -n production svc/chat-service 3002:80 &
kubectl port-forward -n production svc/billing-service 3003:80 &

curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health

# Kill port forwards
killall kubectl
```

---

## 📋 CHECKLIST

- [ ] Docker Desktop running
- [ ] Kubernetes enabled
- [ ] Images built (3 services)
- [ ] Secrets configured
- [ ] Deployed to K8s
- [ ] All pods running
- [ ] Health checks pass

---

## 📚 FULL GUIDE

See `CURRENT_DEPLOYMENT_STATUS.md` for complete details, troubleshooting, and reference.

---

**Total Time**: ~25-30 minutes (if all goes smoothly)
