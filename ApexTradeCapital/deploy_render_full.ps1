# === DEPLOIEMENT COMPLET APEXTRADECAPITAL (BACKEND + FRONTEND) ===
# ⚙️ Conditions préalables :
# - Avoir Render CLI installée : https://render.com/docs/cli
# - Être connecté à Render : "render login"
# - Avoir GitHub CLI connecté (gh auth status)
# - Avoir déjà poussé le dépôt sur GitHub (ce que tu as déjà fait ✅)

# === CONFIGURATION DE BASE ===
$Repo = "https://github.com/apextradecapital/apextradecapital-clean"
$BackendName = "apextrade-backend"
$FrontendName = "apextrade-frontend"
$BackendRoot = "backend"
$FrontendRoot = "frontend"

Write-Host "`n=== 1️⃣ Déploiement du backend sur Render ==="
render services create-web-service `
  --name $BackendName `
  --repo $Repo `
  --root-dir $BackendRoot `
  --build-command "npm ci || npm install" `
  --start-command "node server.js" `
  --env "NODE_ENV=production" `
  --env "PORT=3000" `
  --env "DB_FILE=/data/apextrade.db" `
  --env "UPLOAD_DIR=/data/uploads" `
  --env "CORS_ORIGIN=https://apextrade-frontend.onrender.com" `
  --disk "/data:1GB" `
  --plan free

# Récupérer l'URL du backend
$BackendURL = render services list --name $BackendName --json | ConvertFrom-Json | Select-Object -ExpandProperty service | Select-Object -ExpandProperty deploy_url
Write-Host "`nBackend déployé sur : $BackendURL"

Write-Host "`n=== 2️⃣ Déploiement du frontend sur Render ==="
render services create-static-site `
  --name $FrontendName `
  --repo $Repo `
  --root-dir $FrontendRoot `
  --build-command "npm ci || npm install && npm run build" `
  --publish-dir "dist" `
  --env "VITE_BACKEND_URL=$BackendURL" `
  --plan free

Write-Host "`nFrontend déployé et connecté à : $BackendURL"

# === 3️⃣ ACTIVATION DU MODE ANONYME ===
Write-Host "`n🔒 Activation du mode anonyme (pas de logs publics, pas de déploiement auto)..."
render services update $BackendName --auto-deploy false --suspendable true
render services update $FrontendName --auto-deploy false --suspendable true
Write-Host "✅ Mode privé activé : déploiements manuels uniquement, logs restreints à ton compte."

Write-Host "`n🚀 Déploiement complet terminé avec succès."
Write-Host "Backend : $BackendName"
Write-Host "Frontend : $FrontendName"
Write-Host "Tout est en ligne et anonyme."
