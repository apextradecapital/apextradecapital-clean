# =====================================================
# 🚀 APEX TRADE CAPITAL - INSTALLATION ET LANCEMENT LOCAL
# Version 1.2 : Nettoyage + Vérification Ports + Auto-Lancement
# =====================================================

Write-Host "=== 🚀 Initialisation Apex Trade Capital ===" -ForegroundColor Cyan

# Dossiers
$backendPath = "$PWD\backend"
$rootPath = "$PWD"

# -----------------------------------------------------
# 🧹 1. Nettoyage automatique
# -----------------------------------------------------
Write-Host "🧹 Nettoyage automatique des caches Node/Vite..." -ForegroundColor Yellow

# Suppression de node_modules et dist si présents
$pathsToClean = @(
    "$rootPath\node_modules",
    "$rootPath\dist",
    "$backendPath\node_modules",
    "$backendPath\dist",
    "$env:APPDATA\npm-cache",
    "$env:LOCALAPPDATA\vite"
)
foreach ($path in $pathsToClean) {
    if (Test-Path $path) { Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue }
}
npm cache clean --force | Out-Null

Write-Host "✅ Cache nettoyé avec succès." -ForegroundColor Green

# -----------------------------------------------------
# ⚙️ 2. Configuration des fichiers .env
# -----------------------------------------------------
Write-Host "⚙️ Configuration des fichiers d'environnement..." -ForegroundColor Yellow

if (Test-Path "$backendPath") {
    Set-Location $backendPath
    $envBackend = @"
PORT=3000
CORS_ORIGINS=http://localhost:5173,http://localhost:8080
"@
    $envBackend | Out-File -Encoding utf8 .env
    Write-Host "✅ Fichier .env backend configuré."
} else {
    Write-Host "⚠️ Dossier backend introuvable." -ForegroundColor Red
}

Set-Location $rootPath
$envFrontend = @"
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000/ws/admin
"@
$envFrontend | Out-File -Encoding utf8 .env
Write-Host "✅ Fichier .env frontend configuré."

# -----------------------------------------------------
# 🔎 3. Vérification automatique des ports
# -----------------------------------------------------
function Test-Port {
    param([int]$Port)
    $tcp = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $tcp -ne $null
}

Write-Host "🔍 Vérification des ports..." -ForegroundColor Yellow

if (Test-Port 3000) {
    Write-Host "⚠️ Le port 3000 (backend) est déjà utilisé. Fermeture du processus..." -ForegroundColor Red
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
if (Test-Port 5173) {
    Write-Host "⚠️ Le port 5173 (frontend) est déjà utilisé. Fermeture du processus..." -ForegroundColor Red
    Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "✅ Ports libérés et prêts à être utilisés." -ForegroundColor Green

# -----------------------------------------------------
# 💗 4. Vérification du backend
# -----------------------------------------------------
Write-Host "💗 Vérification du backend..." -ForegroundColor Yellow
$backendHealthy = $false
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 5
    if ($response.ok -eq $true) { $backendHealthy = $true }
} catch {}

if ($backendHealthy) {
    Write-Host "✅ Backend déjà actif." -ForegroundColor Green
} else {
    Write-Host "🟢 Démarrage du backend..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "cd '$backendPath'; npm install; node server.js" -WindowStyle Minimized
    Start-Sleep -Seconds 8
}

# -----------------------------------------------------
# 💙 5. Lancement du frontend (Vite)
# -----------------------------------------------------
Write-Host "💙 Lancement du frontend (Vite)..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "cd '$rootPath'; npm install; npm run dev" -WindowStyle Minimized
    Write-Host "✅ Frontend lancé avec succès." -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur au lancement du frontend." -ForegroundColor Red
}

# -----------------------------------------------------
# 🧩 6. Résumé final
# -----------------------------------------------------
Write-Host ""
Write-Host "==============================================" -ForegroundColor DarkGray
Write-Host "✨ Installation complète réussie !" -ForegroundColor Green
Write-Host "🌍 Frontend disponible : http://localhost:5173/"
Write-Host "🖥️ Backend disponible : http://localhost:3000/"
Write-Host "==============================================" -ForegroundColor DarkGray
