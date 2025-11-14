#!/bin/bash
# Sync environment variables to all services

echo "🔄 Syncing .env to all services..."

# Database URL
DATABASE_URL="postgresql://neondb_owner:npg_vQGfJx9H8pjD@ep-sparkling-sun-a1gledz5-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Services to update
SERVICES=(
  "services/auth-service"
  "services/chat-service"
  "services/billing-service"
  "services/analytics-service"
  "services/email-worker"
)

for service in "${SERVICES[@]}"; do
  if [ -f "$service/.env" ]; then
    echo "  ✅ Updating $service/.env"
    
    # Update or add DATABASE_URL
    if grep -q "^DATABASE_URL=" "$service/.env"; then
      sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" "$service/.env"
    else
      echo "DATABASE_URL=\"$DATABASE_URL\"" >> "$service/.env"
    fi
  else
    echo "  ⚠️  $service/.env not found"
  fi
done

echo "✅ Done!"
