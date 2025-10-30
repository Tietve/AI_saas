#!/bin/bash

# =============================================================================
# Kubernetes Secrets Creation Script
# =============================================================================
# This script creates all required secrets for My-SaaS-Chat
# Usage: ./create-secrets.sh
# =============================================================================

set -e

NAMESPACE="my-saas-chat"

echo "🔐 Creating Kubernetes Secrets for $NAMESPACE"
echo

# Check if namespace exists
if ! kubectl get namespace $NAMESPACE &> /dev/null; then
    echo "❌ Namespace '$NAMESPACE' does not exist. Creating it..."
    kubectl create namespace $NAMESPACE
fi

# =============================================================================
# 1. AUTH SECRET
# =============================================================================
echo "📝 Creating auth-secret..."

# Generate strong secret if not provided
if [ -z "$AUTH_SECRET" ]; then
    echo "   Generating random AUTH_SECRET..."
    AUTH_SECRET=$(openssl rand -base64 48)
fi

kubectl create secret generic auth-secret \
  --from-literal=AUTH_SECRET="$AUTH_SECRET" \
  --namespace=$NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

echo "   ✅ auth-secret created"

# =============================================================================
# 2. DATABASE SECRET
# =============================================================================
echo "📝 Creating database-secret..."

POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 32)}"
MONGO_PASSWORD="${MONGO_PASSWORD:-$(openssl rand -base64 32)}"

kubectl create secret generic database-secret \
  --from-literal=POSTGRES_USER="postgres" \
  --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --from-literal=MONGO_INITDB_ROOT_USERNAME="admin" \
  --from-literal=MONGO_INITDB_ROOT_PASSWORD="$MONGO_PASSWORD" \
  --namespace=$NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

echo "   ✅ database-secret created"

# =============================================================================
# 3. API KEYS SECRET
# =============================================================================
echo "📝 Creating api-keys-secret..."

if [ -z "$OPENAI_API_KEY" ]; then
    echo "   ⚠️  WARNING: OPENAI_API_KEY not set!"
    echo "   Set it with: export OPENAI_API_KEY=sk-your-key"
    OPENAI_API_KEY="sk-REPLACE-ME"
fi

kubectl create secret generic api-keys-secret \
  --from-literal=OPENAI_API_KEY="${OPENAI_API_KEY}" \
  --from-literal=ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
  --from-literal=GOOGLE_API_KEY="${GOOGLE_API_KEY:-}" \
  --from-literal=GROQ_API_KEY="${GROQ_API_KEY:-}" \
  --from-literal=STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk-REPLACE-ME}" \
  --from-literal=STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}" \
  --from-literal=SENTRY_DSN="${SENTRY_DSN:-}" \
  --namespace=$NAMESPACE \
  --dry-run=client -o yaml | kubectl apply -f -

echo "   ✅ api-keys-secret created"

# =============================================================================
# 4. SMTP SECRET (Optional)
# =============================================================================
if [ -n "$SMTP_HOST" ]; then
    echo "📝 Creating smtp-secret..."

    kubectl create secret generic smtp-secret \
      --from-literal=SMTP_HOST="${SMTP_HOST}" \
      --from-literal=SMTP_USER="${SMTP_USER}" \
      --from-literal=SMTP_PASS="${SMTP_PASS}" \
      --namespace=$NAMESPACE \
      --dry-run=client -o yaml | kubectl apply -f -

    echo "   ✅ smtp-secret created"
else
    echo "⏭️  Skipping smtp-secret (SMTP_HOST not set)"
fi

# =============================================================================
# Summary
# =============================================================================
echo
echo "✅ All secrets created successfully!"
echo
echo "📋 Created secrets:"
kubectl get secrets -n $NAMESPACE
echo
echo "🔍 To view a secret:"
echo "   kubectl get secret auth-secret -n $NAMESPACE -o yaml"
echo
echo "🗑️  To delete all secrets:"
echo "   kubectl delete secret auth-secret database-secret api-keys-secret -n $NAMESPACE"
echo
