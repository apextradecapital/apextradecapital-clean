# ==============================
#   APEX TRADE CAPITAL - DEPLOIEMENT PUBLIC SECURISE (SANS AUTH)
# ==============================

Write-Host "`n🚀 Initialisation du système APEX..." -ForegroundColor Cyan

# --- Nettoyage du cache ---
Write-Host "🧹 Nettoyage du cache..." -ForegroundColor Yellow
try {
    npm cache clean --force | Out-Null
    Remove-Item "$env:LOCALAPPDATA\Temp\vite" -Recurse -ErrorAction SilentlyContinue
    Remove-Item "$env:APPDATA\npm-cache" -Recurse -ErrorAction SilentlyContinue
    Write-Host "✅ Cache nettoyé." -ForegroundColor Green
} catch {
    Write-Host "⚠️ Nettoyage partiel du cache." -ForegroundColor DarkYellow
}

# --- Lancement du backend ---
Write-Host "`n🧩 Démarrage du backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd 'C:\ApexTradeCapital\backend'; node server.js" -WindowStyle Minimized
Start-Sleep -Seconds 5

# --- Vérification du backend ---
$response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -ErrorAction SilentlyContinue
if ($response -and $response.StatusCode -eq 200) {
    Write-Host "✅ Backend actif sur http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend non détecté. Vérifie ton server.js" -ForegroundColor Red
}

# --- Lancement du frontend ---
if (Test-Path "C:\ApexTradeCapital\frontend") {
    Write-Host "`n🧠 Démarrage du frontend (Vite)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "cd 'C:\ApexTradeCapital\frontend'; npm run dev" -WindowStyle Minimized
    Write-Host "✅ Frontend actif sur http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "⚠️ Aucun frontend trouvé." -ForegroundColor DarkYellow
}

# --- Démarrage du tunnel Ngrok public sécurisé ---
Write-Host "`n🔐 Lancement du tunnel Ngrok (HTTPS public sans mot de passe)..." -ForegroundColor Cyan
$ngrokAuth = Read-Host "👉 Entre ton token Ngrok (depuis https://dashboard.ngrok.com/get-started/your-authtoken)"
if ($ngrokAuth -ne "") {
    & ngrok authtoken $ngrokAuth
}

Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "ngrok http 5173 --region=eu --bind-tls=true" -WindowStyle Minimized

Write-Host "`n🌍 Tunnel public sécurisé en cours de création..."
Write-Host "🔗 Consulte ton lien sur : https://dashboard.ngrok.com/status/tunnels" -ForegroundColor Green
Write-Host "`n🟢 APEX TRADE CAPITAL prêt à l'usage public sécurisé."

