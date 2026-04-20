param(
  [string]$ResourceGroup = "rg-cafe-prod",
  [string]$Location = "centralindia",
  [string]$PlanName = "asp-cafe-prod",
  [string]$WebAppName = "app-cafe-api-prod",
  [string]$Runtime = "NODE:20-lts"
)

Write-Host "Creating Azure resource group and Linux App Service plan..."
az group create --name $ResourceGroup --location $Location

az appservice plan create `
  --resource-group $ResourceGroup `
  --name $PlanName `
  --location $Location `
  --sku P1v3 `
  --is-linux

az webapp create `
  --resource-group $ResourceGroup `
  --plan $PlanName `
  --name $WebAppName `
  --runtime $Runtime

Write-Host "Configure app settings in Azure after creation, then deploy the backend folder with zip deploy or GitHub Actions."
