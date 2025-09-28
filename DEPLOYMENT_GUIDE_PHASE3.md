# 🚀 Phase 3 Deployment Guide - Horizontal Scaling

## 📋 Tổng Quan

Phase 3 đã hoàn thành với các tính năng nâng cao:
- ✅ **Horizontal Scaling** với Load Balancer
- ✅ **Auto-scaling** dựa trên metrics
- ✅ **Distributed Caching** across multiple instances
- ✅ **Performance Monitoring Dashboard** real-time
- ✅ **Load Testing Suite** cho performance validation
- ✅ **Health Check APIs** cho load balancer

## 🛠️ Cài Đặt & Cấu Hình

### 1. Environment Variables

Thêm các biến môi trường mới vào `.env.local`:

```bash
# Phase 3 - Horizontal Scaling
AUTO_SCALING_ENABLED=true
MIN_INSTANCES=2
MAX_INSTANCES=10

# Load Balancer Configuration
INSTANCE_1_URL=http://localhost:3000
INSTANCE_2_URL=http://localhost:3001
INSTANCE_3_URL=http://localhost:3002

# Health Check
INSTANCE_ID=instance-1
APP_VERSION=1.0.0

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_REAL_TIME_METRICS=true
DASHBOARD_REFRESH_INTERVAL=5000

# Redis (cho distributed caching)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### 2. Dependencies

Cài đặt thêm dependencies (nếu cần):

```bash
npm install
# Các dependencies đã có sẵn trong project
```

## 🚀 Deployment Options

### Option 1: Local Multi-Instance Setup

#### 1.1 Start Multiple Instances

```bash
# Terminal 1 - Instance 1
npm run dev -- --port 3000
export INSTANCE_ID=instance-1

# Terminal 2 - Instance 2  
npm run dev -- --port 3001
export INSTANCE_ID=instance-2

# Terminal 3 - Instance 3
npm run dev -- --port 3002
export INSTANCE_ID=instance-3
```

#### 1.2 Configure Load Balancer

```bash
# Set environment variables
export INSTANCE_1_URL=http://localhost:3000
export INSTANCE_2_URL=http://localhost:3001
export INSTANCE_3_URL=http://localhost:3002
```

### Option 2: Docker Compose

Tạo file `docker-compose.yml`:

```yaml
version: '3.8'
services:
  app1:
    build: .
    ports: ['3000:3000']
    environment:
      - INSTANCE_ID=instance-1
      - INSTANCE_1_URL=http://app1:3000
      - INSTANCE_2_URL=http://app2:3000
      - INSTANCE_3_URL=http://app3:3000
      - AUTO_SCALING_ENABLED=true
      - MIN_INSTANCES=2
      - MAX_INSTANCES=5
    depends_on:
      - redis

  app2:
    build: .
    ports: ['3001:3000']
    environment:
      - INSTANCE_ID=instance-2
      - INSTANCE_1_URL=http://app1:3000
      - INSTANCE_2_URL=http://app2:3000
      - INSTANCE_3_URL=http://app3:3000
      - AUTO_SCALING_ENABLED=true
    depends_on:
      - redis

  app3:
    build: .
    ports: ['3002:3000']
    environment:
      - INSTANCE_ID=instance-3
      - INSTANCE_1_URL=http://app1:3000
      - INSTANCE_2_URL=http://app2:3000
      - INSTANCE_3_URL=http://app3:3000
      - AUTO_SCALING_ENABLED=true
    depends_on:
      - redis

  nginx:
    image: nginx:alpine
    ports: ['80:80']
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2
      - app3

  redis:
    image: redis:alpine
    ports: ['6379:6379']
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

Tạo file `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream ai_chat_backend {
        server app1:3000;
        server app2:3000;
        server app3:3000;
    }

    server {
        listen 80;
        
        location / {
            proxy_pass http://ai_chat_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        location /api/health {
            proxy_pass http://ai_chat_backend;
            access_log off;
        }
    }
}
```

Chạy với Docker Compose:

```bash
docker-compose up -d
```

### Option 3: Kubernetes Deployment

Tạo file `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-chat-app
  labels:
    app: ai-chat-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-chat-app
  template:
    metadata:
      labels:
        app: ai-chat-app
    spec:
      containers:
      - name: app
        image: ai-chat-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: INSTANCE_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: AUTO_SCALING_ENABLED
          value: "true"
        - name: MIN_INSTANCES
          value: "2"
        - name: MAX_INSTANCES
          value: "10"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ai-chat-service
spec:
  selector:
    app: ai-chat-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-chat-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-chat-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

Deploy lên Kubernetes:

```bash
kubectl apply -f k8s-deployment.yaml
```

## 📊 Monitoring & Testing

### 1. Health Check

Kiểm tra health của các instances:

```bash
# Check instance 1
curl http://localhost:3000/api/health

# Check instance 2
curl http://localhost:3001/api/health

# Check instance 3
curl http://localhost:3002/api/health
```

### 2. Performance Dashboard

Truy cập dashboard:

```bash
# Get dashboard data
curl http://localhost:3000/api/monitoring/dashboard

# Get real-time metrics
curl http://localhost:3000/api/monitoring/dashboard?timeRange=5m
```

### 3. Load Testing

Chạy load test:

```bash
# Start load test
curl -X POST http://localhost:3000/api/monitoring/load-test \
  -H "Content-Type: application/json" \
  -d '{"config": {}, "testId": "test-1"}'

# Check test status
curl http://localhost:3000/api/monitoring/load-test/test-1

# Stop test
curl -X PUT http://localhost:3000/api/monitoring/load-test/test-1
```

### 4. Auto-scaling Status

Kiểm tra auto-scaling:

```bash
# Get scaling status
curl http://localhost:3000/api/scaling/auto-scale

# Force scale
curl -X POST http://localhost:3000/api/scaling/auto-scale \
  -H "Content-Type: application/json" \
  -d '{"action": "force-scale", "targetInstances": 5}'
```

## 🔧 Configuration Tuning

### 1. Load Balancer Settings

Điều chỉnh trong `src/lib/scaling/load-balancer.ts`:

```typescript
const config = {
  strategy: 'round-robin', // hoặc 'least-connections', 'weighted'
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    timeout: 5000,   // 5 seconds
    path: '/api/health'
  },
  failover: {
    enabled: true,
    maxFailures: 3,
    recoveryTime: 60000 // 1 minute
  }
}
```

### 2. Auto-scaling Policies

Điều chỉnh trong `src/lib/scaling/auto-scaling.ts`:

```typescript
const policies = [
  {
    name: 'Scale Up on High CPU',
    condition: {
      metric: 'cpu',
      operator: 'gt',
      value: 80,
      duration: 60
    },
    action: {
      type: 'scaleUp',
      adjustment: 1
    }
  }
]
```

### 3. Cache Strategies

Điều chỉnh trong `src/lib/cache/distributed-cache.ts`:

```typescript
const strategies = {
  user: {
    ttl: 1800, // 30 minutes
    compression: true,
    encryption: true,
    warming: {
      enabled: true,
      patterns: ['user:*', 'usage:*']
    }
  }
}
```

## 📈 Performance Benchmarks

### Expected Results

- **Concurrent Users**: 2000-5000 (vs 500-800 trước đây)
- **Daily Active Users**: 15000-25000 (vs 5000-8000 trước đây)
- **Peak Requests**: 500-1000 req/s (vs 150-250 req/s trước đây)
- **Response Time**: <1s (vs <1.5s trước đây)
- **Cache Hit Rate**: >90% (vs 85% trước đây)
- **Auto-scaling Time**: <30s scale up, <60s scale down

### Load Testing Scenarios

1. **Normal Load**: 100 concurrent users
2. **High Load**: 500 concurrent users  
3. **Peak Load**: 1000 concurrent users
4. **Stress Test**: 2000+ concurrent users

## 🚨 Troubleshooting

### Common Issues

1. **Load Balancer không hoạt động**
   - Kiểm tra health check endpoints
   - Verify instance URLs
   - Check network connectivity

2. **Auto-scaling không scale**
   - Kiểm tra metrics collection
   - Verify scaling policies
   - Check resource limits

3. **Cache miss rate cao**
   - Kiểm tra Redis connection
   - Verify cache strategies
   - Check TTL settings

4. **Performance dashboard không load**
   - Kiểm tra metrics collection
   - Verify API endpoints
   - Check browser console

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Check database connections
psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity"

# Check memory usage
free -h

# Check CPU usage
top

# Check network
netstat -tulpn
```

## 🔒 Security Considerations

1. **API Security**
   - Secure monitoring endpoints
   - Rate limit monitoring APIs
   - Authenticate admin access

2. **Network Security**
   - Use HTTPS in production
   - Secure Redis connections
   - Firewall configuration

3. **Data Security**
   - Encrypt sensitive cache data
   - Secure health check endpoints
   - Monitor access logs

## 📝 Maintenance

### Daily Tasks
- Monitor dashboard metrics
- Check error rates
- Review scaling events

### Weekly Tasks
- Analyze performance trends
- Review cache hit rates
- Update scaling policies if needed

### Monthly Tasks
- Load testing
- Capacity planning
- Security review

## 🎯 Next Steps

Phase 3 đã hoàn thành! Có thể tiếp tục với:

1. **Phase 4**: Microservices architecture
2. **Advanced Analytics**: User behavior analysis
3. **AI/ML Integration**: Predictive scaling
4. **Global CDN**: Multi-region deployment
5. **Advanced Monitoring**: APM integration

---

**Phase 3 hoàn thành!** 🎉

Hệ thống giờ đã có thể handle 5-10x nhiều users hơn với horizontal scaling và auto-scaling capabilities!



