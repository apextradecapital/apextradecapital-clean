# === TEST LOCAL DU BACKEND APEX ===
$ErrorActionPreference = "Stop"
Write-Host "=== Test du backend ApexTradeCapital localement ==="

# 1. Aller dans le dossier backend
$root = Get-Location
$backend = Join-Path $root "backend"
if (!(Test-Path $backend)) { throw "Le dossier 'backend' est introuvable." }
Set-Location $backend

# 2. Vérifier le fichier principal
if (!(Test-Path "server.js")) { throw "Le fichier server.js est manquant dans backend/" }

# 3. Vérifier le package.json
if (!(Test-Path "package.json")) { throw "Le fichier package.json est manquant." }
Write-Host "✅ package.json trouvé"

# 4. Installation rapide des dépendances
Write-Host "Installation rapide des dépendances (npm ci si possible)..."
if (Test-Path "package-lock.json") {
    npm ci --no-fund --no-audit
} else {
    npm install --no-fund --no-audit
}

# 5. Lancement du serveur pour test
Write-Host "🚀 Lancement du backend en test local (port 3000)..."
$env:PORT = 3000
$env:ADMIN_EMAIL = "loicndjana06@gmail.com"
$env:MAIL_USER = "loicndjana06@gmail.com"
$env:MAIL_PASS = "xuwktigrfnsnarda"
$env:MAIL_HOST = "smtp.gmail.com"
$env:MAIL_PORT = "465"
$env:USD_RATE = "0.012"
$env:WS_PORT = "3001"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js"
Write-Host "✅ Serveur lancé. Ouvre ton navigateur sur : http://localhost:3000/api/health"
Write-Host "Appuie sur CTRL+C pour stopper le serveur quand tu as terminé."