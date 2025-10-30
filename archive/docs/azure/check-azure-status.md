# 🔍 Azure App Service Status Check

## 📋 Current Status

**App Service**: `firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net`
**Status**: ❌ Service Unavailable (503)

## 🛠️ Troubleshooting Steps

### 1. Check App Service Status
```bash
az webapp show --name firbox-api --resource-group firbox-rg --query "state"
```

### 2. Check Recent Deployments  
```bash
az webapp deployment list --name firbox-api --resource-group firbox-rg --output table
```

### 3. View Application Logs
```bash
# Live logs
az webapp log tail --name firbox-api --resource-group firbox-rg

# Download logs
az webapp log download --name firbox-api --resource-group firbox-rg --log-file logs.zip
```

### 4. Check Configuration
```bash
# Startup command
az webapp config show --name firbox-api --resource-group firbox-rg --query "appCommandLine"

# App settings
az webapp config appsettings list --name firbox-api --resource-group firbox-rg --output table
```

### 5. Restart App Service
```bash
az webapp restart --name firbox-api --resource-group firbox-rg
```

## 🚨 Possible Issues

### Issue 1: App Not Starting
**Symptoms**: 503 Service Unavailable
**Causes**:
- Wrong startup command
- Missing dependencies  
- Environment variables not set
- App crashes on startup

**Solutions**:
1. Check startup command: `npm start`
2. Verify `server.js` exists
3. Check Node.js version: `NODE|20-lts`

### Issue 2: Build Failed
**Symptoms**: Deployment succeeds but app doesn't start
**Causes**:
- Build errors during deployment
- Missing `.next` folder
- TypeScript errors

**Solutions**:
1. Check build logs in deployment center
2. Ensure `npm run build` works locally
3. Set `SKIP_ENV_VALIDATION=1`

### Issue 3: Port Binding
**Symptoms**: App starts but not accessible
**Causes**:
- App not listening on `process.env.PORT`
- Wrong hostname binding

**Solutions**:
1. Verify `server.js` uses `process.env.PORT`
2. Bind to `0.0.0.0` not `localhost`

## 🎯 Next Steps

1. **Check logs** to identify root cause
2. **Restart app** if it's just stuck
3. **Redeploy** with fixed configuration
4. **Test health endpoint** after restart

## 📞 Commands to Run

```bash
# Quick status check
az webapp show --name firbox-api --resource-group firbox-rg --query "{name:name, state:state, defaultHostName:defaultHostName}"

# Restart and monitor
az webapp restart --name firbox-api --resource-group firbox-rg
sleep 30
curl -I https://firbox-api-ddhtc0hfd2brhaa4.southeastasia-01.azurewebsites.net/api/health
```
