#!/bin/bash

# Script to check Azure App Service logs
# Usage: ./scripts/check-azure-logs.sh

APP_NAME="${AZURE_APP_NAME:-firbox-api}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-firai-rg}"

echo "🔍 Checking Azure logs for: $APP_NAME"
echo "========================================"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not installed. Install it from:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Run: az login"
    exit 1
fi

echo ""
echo "📊 Fetching latest logs (last 100 lines)..."
echo "----------------------------------------"

# Stream logs
az webapp log tail \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --lines 100

echo ""
echo "----------------------------------------"
echo "💡 To stream logs in real-time, run:"
echo "   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "💡 To download logs, run:"
echo "   az webapp log download --name $APP_NAME --resource-group $RESOURCE_GROUP --log-file azure-logs.zip"
