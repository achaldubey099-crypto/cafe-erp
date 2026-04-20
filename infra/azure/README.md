# Azure Production Edge for Cafe ERP

This guide assumes the recommended managed-service topology:

`Vercel frontend -> Azure Application Gateway WAF_v2 -> Azure App Service (backend) -> MongoDB`

Why this path:

- Uses only Azure-native edge and scaling services
- Avoids manual load balancers and NGINX
- Keeps the Node API unchanged behind a managed Layer 7 gateway
- Scales cleanly for multiple cafe tenants

If you are already on Azure VMs, keep Application Gateway + WAF exactly the same and swap the autoscale section to a VM Scale Set backend pool.

## 1. Backend changes required

Already added in the codebase:

- `GET /health`: readiness probe for Application Gateway
- `GET /health/live`: liveness probe
- `app.set('trust proxy', 1)`: preserves original client information behind Application Gateway/WAF

The backend is already stateless for auth flow review:

- No `express-session`
- No in-memory session store
- JWT-based auth only

For production CORS, set:

```env
NODE_ENV=production
CORS_ALLOWED_ORIGINS=https://your-production-frontend.example.com
```

Use only the production Vercel custom domain here. Keep preview domains in non-production if needed.

## 2. Azure resources to create

- Resource Group
- Virtual Network
- `appgw-subnet`
- `private-endpoints-subnet` if you place the backend privately
- Azure DDoS Network Protection plan attached to the VNet
- Public IP for Application Gateway
- Application Gateway `WAF_v2`
- WAF Policy
- App Service Plan
- Web App for the backend
- Log Analytics Workspace
- Application Insights
- Azure Monitor alerts
- Key Vault certificate for Application Gateway HTTPS listener

## 3. Recommended routing model

- Public traffic terminates on Application Gateway
- HTTP listener redirects to HTTPS
- HTTPS listener forwards only to healthy backend targets
- Health probe path: `/health`
- Backend protocol: HTTPS if your App Service exposes TLS, otherwise HTTP inside a locked-down path

## 4. Step-by-step deployment

### 4.1 Resource group, monitoring, and network

```powershell
# Fill these values first
$RG = "rg-cafe-prod"
$LOCATION = "centralindia"
$VNET = "vnet-cafe-prod"
$APPGW_SUBNET = "appgw-subnet"
$PE_SUBNET = "private-endpoints-subnet"
$DDOS_PLAN = "ddos-cafe-prod"
$LAW = "log-cafe-prod"
$APPINSIGHTS = "appi-cafe-prod"
$PIP = "pip-appgw-cafe-prod"

az group create --name $RG --location $LOCATION

az monitor log-analytics workspace create `
  --resource-group $RG `
  --workspace-name $LAW `
  --location $LOCATION

az monitor app-insights component create `
  --app $APPINSIGHTS `
  --location $LOCATION `
  --resource-group $RG `
  --workspace $LAW `
  --application-type web

az network vnet create `
  --resource-group $RG `
  --name $VNET `
  --location $LOCATION `
  --address-prefix 10.40.0.0/16 `
  --subnet-name $APPGW_SUBNET `
  --subnet-prefix 10.40.1.0/24

az network vnet subnet create `
  --resource-group $RG `
  --vnet-name $VNET `
  --name $PE_SUBNET `
  --address-prefixes 10.40.2.0/24

az network ddos-protection create `
  --resource-group $RG `
  --name $DDOS_PLAN `
  --location $LOCATION

az network vnet update `
  --resource-group $RG `
  --name $VNET `
  --ddos-protection true `
  --ddos-protection-plan $DDOS_PLAN

az network public-ip create `
  --resource-group $RG `
  --name $PIP `
  --sku Standard `
  --allocation-method Static `
  --zone 1 2 3
```

### 4.2 App Service backend with autoscale

```powershell
$PLAN = "asp-cafe-prod"
$WEBAPP = "app-cafe-api-prod"
$RUNTIME = "NODE|20-lts"

az appservice plan create `
  --resource-group $RG `
  --name $PLAN `
  --location $LOCATION `
  --sku P1v3 `
  --is-linux

az webapp create `
  --resource-group $RG `
  --plan $PLAN `
  --name $WEBAPP `
  --runtime $RUNTIME

az webapp config appsettings set `
  --resource-group $RG `
  --name $WEBAPP `
  --settings `
    NODE_ENV=production `
    PORT=8080 `
    CORS_ALLOWED_ORIGINS=https://your-production-frontend.example.com
```

Configure App Service autoscale:

```powershell
$AUTOSCALE = "autoscale-cafe-api"
$PLAN_ID = "/subscriptions/<subscription-id>/resourceGroups/$RG/providers/Microsoft.Web/serverfarms/$PLAN"

az monitor autoscale create `
  --resource-group $RG `
  --resource $PLAN `
  --resource-type Microsoft.Web/serverfarms `
  --name $AUTOSCALE `
  --min-count 2 `
  --max-count 10 `
  --count 2

# Scale out on CPU >= 70%
az monitor autoscale rule create `
  --resource-group $RG `
  --autoscale-name $AUTOSCALE `
  --condition "CpuPercentage > 70 avg 5m" `
  --scale out 1

# Scale in on CPU <= 35%
az monitor autoscale rule create `
  --resource-group $RG `
  --autoscale-name $AUTOSCALE `
  --condition "CpuPercentage < 35 avg 10m" `
  --scale in 1

# Starting point for request-count based scaling.
# Tune after first load test window.
az monitor autoscale rule create `
  --resource-group $RG `
  --autoscale-name $AUTOSCALE `
  --condition "Requests > 1000 avg 5m" `
  --scale out 1

az monitor autoscale rule create `
  --resource-group $RG `
  --autoscale-name $AUTOSCALE `
  --condition "Requests < 300 avg 10m" `
  --scale in 1
```

### 4.3 WAF policy with OWASP + Bot Manager + rate limit

Use a dedicated WAF policy and attach it to Application Gateway.

```powershell
$WAF = "waf-cafe-prod"

az network application-gateway waf-policy create `
  --resource-group $RG `
  --name $WAF `
  --location $LOCATION `
  --type OWASP `
  --version 3.2

az network application-gateway waf-policy managed-rule rule-set add `
  --resource-group $RG `
  --policy-name $WAF `
  --type Microsoft_BotManagerRuleSet `
  --version 1.1
```

Rate limit rule target:

- Match variable: `ClientAddr`
- Threshold: `100`
- Duration: `One minute`
- Action: `Block`

The safest production setup is to set the WAF custom block status code to `429` and a short JSON response body, for example:

```json
{"message":"Too many requests"}
```

Create the custom rate-limit rule in the portal if your CLI version does not expose rate-limit custom rule flags yet:

- `Application Gateway WAF policy -> Custom rules -> Add custom rule`
- Rule type: `Rate limit`
- Priority: `100`
- Name: `rate-limit-per-ip`
- Match condition: `RemoteAddr`
- Operator: `IPMatch` with `0.0.0.0/0`
- Rate limit threshold: `100`
- Group by: `ClientAddr`
- Action: `Block`
- Custom block response code: `429`

### 4.4 Application Gateway WAF_v2

```powershell
$APPGW = "appgw-cafe-prod"
$CERT_SECRET_ID = "/subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<kv>/secrets/<cert>/<version>"

az network application-gateway create `
  --resource-group $RG `
  --name $APPGW `
  --location $LOCATION `
  --sku WAF_v2 `
  --capacity 2 `
  --public-ip-address $PIP `
  --vnet-name $VNET `
  --subnet $APPGW_SUBNET `
  --waf-policy $WAF
```

Then configure:

- Frontend HTTP listener on port `80`
- Frontend HTTPS listener on port `443`
- HTTP -> HTTPS redirect
- Backend pool pointing to your backend targets
- Health probe using `GET /health`
- Backend HTTP settings using the health probe

For App Service backend targets, use the web app hostname or private endpoint target if you want private-only backend connectivity.

Probe settings:

- Path: `/health`
- Interval: `30s`
- Timeout: `30s`
- Unhealthy threshold: `3`

### 4.5 HTTPS certificates

For Application Gateway frontend TLS, use a certificate stored in Azure Key Vault and reference it from Application Gateway.

Recommended production options:

- Azure App Service Certificate -> store in Key Vault -> attach to Application Gateway
- Any enterprise certificate lifecycle already integrated with Key Vault

Also enforce:

- HTTPS-only on App Service
- HTTP to HTTPS redirect on Application Gateway

### 4.6 Logging, diagnostics, and alerts

Enable diagnostic settings for:

- Application Gateway access logs
- Application Gateway firewall logs
- Application Gateway performance logs
- App Service HTTP logs and platform metrics

Suggested alert rules:

- Backend unhealthy host count > 0
- 5xx response spike on Application Gateway
- WAF blocked requests spike
- DDoS attack detected
- Requests sudden surge above baseline

Example metric-alert targets:

- Application Gateway: `Failed Requests`, `Response Status`, `Unhealthy Host Count`, `CurrentConnections`
- WAF: blocked request count from firewall logs
- App Service Plan: `CpuPercentage`, `Requests`
- DDoS plan: mitigation and attack metrics

## 5. VM Scale Set alternative

If your backend is already on Azure VMs and you want to keep that model:

- Put backend VMs into a VM Scale Set
- Attach VMSS NIC configuration to Application Gateway backend pool
- Reuse the same `/health` probe
- Use Azure Monitor autoscale on VMSS with:
  - CPU >= 70% scale out
  - Request-count or Application Gateway metrics to scale out
  - Min 2, max 10

Do not place a separate manual load balancer in front of Application Gateway.

## 6. Safe validation plan

### Verify load balancing

1. Add an instance identifier to logs or a response header in non-production.
2. Send repeated requests through Application Gateway.
3. Confirm requests land on multiple healthy backend instances.
4. Stop one backend instance.
5. Confirm Application Gateway removes it from healthy rotation after probe failures.

### Verify rate limiting

Use Azure Load Testing or another managed load generator and hit a single API route through Application Gateway:

- Warm up slowly
- Exceed `100 req/min` from one client source
- Confirm WAF returns `429`
- Confirm backend remains healthy

### Verify DDoS-like behavior safely

Do not run an uncontrolled internet flood.

Instead:

1. Use Azure Load Testing from approved test IP ranges
2. Increase concurrent users gradually
3. Watch:
   - Application Gateway metrics
   - WAF blocks
   - App Service autoscale events
   - DDoS metrics and alerts

## 7. Production checklist

- [ ] `/health` returns `200` when MongoDB is connected
- [ ] Application Gateway probes `/health`
- [ ] WAF policy attached to Application Gateway
- [ ] OWASP 3.2 enabled
- [ ] Bot Manager ruleset enabled
- [ ] Rate limit custom rule blocks at `100 req/min/IP`
- [ ] Custom block response code set to `429`
- [ ] HTTP redirects to HTTPS
- [ ] Application Gateway certificate comes from Key Vault
- [ ] App Service min instances = `2`
- [ ] App Service max instances = `10`
- [ ] CPU autoscale rule >= `70%`
- [ ] Request-count autoscale rule enabled
- [ ] DDoS Network Protection attached to VNet
- [ ] Diagnostic settings send logs to Log Analytics
- [ ] Alerts created for unhealthy hosts, blocked spikes, 5xx spikes, and DDoS events
