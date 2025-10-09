#!/bin/bash
# ================================
# Kubernetes Deployment Script
# ================================

set -e

echo "🚀 Deploying AI SaaS Platform to Kubernetes..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl not found. Please install kubectl first.${NC}"
    exit 1
fi

# Check if connected to cluster
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Not connected to any Kubernetes cluster${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connected to cluster${NC}"

# Create namespace
echo -e "${YELLOW}📦 Creating namespace...${NC}"
kubectl apply -f namespace.yaml

# Create ConfigMap
echo -e "${YELLOW}⚙️  Creating ConfigMap...${NC}"
kubectl apply -f configmap.yaml

# Create Secrets (must exist)
if [ ! -f "secret.yaml" ]; then
    echo -e "${RED}❌ secret.yaml not found!${NC}"
    echo -e "${YELLOW}Please create secret.yaml from secret.yaml.example${NC}"
    exit 1
fi
echo -e "${YELLOW}🔒 Creating Secrets...${NC}"
kubectl apply -f secret.yaml

# Deploy PostgreSQL
echo -e "${YELLOW}🐘 Deploying PostgreSQL...${NC}"
kubectl apply -f postgres.yaml

# Wait for PostgreSQL
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=postgres -n ai-saas --timeout=300s

# Deploy Redis
echo -e "${YELLOW}📮 Deploying Redis...${NC}"
kubectl apply -f redis.yaml

# Wait for Redis
echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=redis -n ai-saas --timeout=300s

# Deploy Application
echo -e "${YELLOW}🚢 Deploying Application...${NC}"
kubectl apply -f deployment.yaml

# Wait for Application
echo -e "${YELLOW}⏳ Waiting for Application to be ready...${NC}"
kubectl wait --for=condition=ready pod -l app=ai-saas-app -n ai-saas --timeout=600s

# Deploy Ingress
echo -e "${YELLOW}🌐 Deploying Ingress...${NC}"
kubectl apply -f ingress.yaml

# Show status
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📊 Current Status:"
kubectl get pods -n ai-saas
echo ""
kubectl get services -n ai-saas
echo ""
kubectl get ingress -n ai-saas
echo ""

# Show logs command
echo -e "${YELLOW}📝 To view logs:${NC}"
echo "kubectl logs -f -l app=ai-saas-app -n ai-saas"
echo ""

# Show port-forward command
echo -e "${YELLOW}🔗 To access locally (port-forward):${NC}"
echo "kubectl port-forward -n ai-saas svc/ai-saas-service 3000:80"
echo ""

echo -e "${GREEN}🎉 Done!${NC}"
