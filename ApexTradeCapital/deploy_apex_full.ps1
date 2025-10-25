# === DEPLOIEMENT APEX TRADE CAPITAL COMPLET (SÉCURISÉ) ===

$repo = "https://github.com/apextradecapital/apextradecapital-clean"
$backendName = "apextradecapital-backend"
$frontendName = "apextradecapital-frontend"

Write-Host "`n🔎 Vérification de l'existence du backend..."
$backendExists = render services list --json | ConvertFrom-Json | Where-Object { $_.service.name -eq $backendName }

if ($backendExists) {
    Write-Host "✅ Backend déjà en ligne → aucun redéploiement nécessaire."
    $backendURL = "https://$backendName.onrender.com"
} else {
    Write-Host "⚙️ Backend introuvable → création du service backend..."
    render services create web-service `
      --name $backendName `
      --repo $repo `
      --root-dir backend `
      --build-command "npm ci || npm install" `
      --start-command "node server.js" `
      --env NODE_ENV=production `
      --env PORT=3000 `
      --plan free `
      --disk /data:1GB
    $backendURL = "https://$backendName.onrender.com"
}

Write-Host "`n🚀 Déploiement du frontend connecté au backend..."
$frontendExists = render services list --json | ConvertFrom-Json | Where-Object { $_.service.name -eq $frontendName }

if ($frontendExists) {
    Write-Host "🔁 Frontend déjà présent → mise à jour en cours..."
    render services deploy $frontendName
} else {
    render services create static-site `
      --name $frontendName `
      --repo $repo `
      --root-dir frontend `
      --build-command "npm ci || npm install && npm run build" `
      --publish-dir dist `
      --env VITE_BACKEND_URL=$backendURL `
      --plan free
}

Write-Host "`n🔒 Activation du mode anonyme (aucun log public)..."
render services update $backendName --auto-deploy false --suspendable true
render services update $frontendName --auto-deploy false --suspendable true

Write-Host "`n✅ Déploiement complet terminé !"
Write-Host "Backend : $backendURL"
Write-Host "Frontend : https://$frontendName.onrender.com"
