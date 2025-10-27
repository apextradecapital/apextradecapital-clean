# === AUTO APEX FRONTEND PATCH (final) ===
$ErrorActionPreference = "Stop"
Write-Host "🚀 Application du patch Frontend Apex Trade Capital..."

# --- Dossiers ---
$root = Get-Location
$fe   = Join-Path $root "frontend"
if (!(Test-Path $fe)) { throw "❌ Dossier frontend introuvable." }

# --- Vérification du logo ---
$logo = Join-Path $fe "public\logo.png"
if (!(Test-Path $logo)) {
    Write-Host "⚠️  Aucun logo trouvé dans frontend/public. Copiez votre logo.png avant d'exécuter ce script."
} else {
    Write-Host "✅ Logo détecté : $logo"
}

# --- Connexion au backend Render ---
$apiFile = Join-Path $fe "src\config.js"
$apiContent = @"
export const API_BASE_URL = "https://apextradecapital-backend.onrender.com/api";
"@
Set-Content $apiFile -Value $apiContent -Encoding UTF8
Write-Host "✅ Fichier config.js mis à jour avec le backend Render."

# --- Thème Apex Trade Capital ---
$cssFile = Join-Path $fe "src\index.css"
$cssTheme = @"
/* === APEX TRADE CAPITAL THEME === */
:root {
  --apex-blue: #1e3a8a;
  --apex-gold: #D4AF37;
}

body {
  background-color: #f9fafb;
  color: #111827;
  font-family: 'Inter', sans-serif;
}

header, nav {
  background-color: var(--apex-blue);
  color: white;
  font-weight: 600;
}

button {
  background-color: var(--apex-gold);
  color: #111827;
  border-radius: 6px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
}

button:hover {
  background-color: #b98d28;
}
"@
Set-Content $cssFile -Value $cssTheme -Encoding UTF8
Write-Host "🎨 Thème Apex bleu & doré appliqué."

# --- Logo dans Header ---
$headerFile = Join-Path $fe "src\components\Header.tsx"
if (Test-Path $headerFile) {
    (Get-Content $headerFile) -replace '<h1>.*?</h1>', '<img src="/logo.png" alt="Apex Trust Capital" class="h-10 inline mr-3" /> <h1>Apex Trust Capital</h1>' | Set-Content $headerFile
    Write-Host "🖼️  Logo ajouté dans le Header."
} else {
    Write-Host "⚠️  Header.tsx non trouvé. Vérifiez le dossier src/components."
}

# --- Build du frontend ---
Push-Location $fe
try {
    if (Test-Path "package-lock.json") {
        npm ci
    } else {
        npm install
    }
    npm run build
    Write-Host "✅ Build du frontend terminé avec succès."
} finally {
    Pop-Location
}

Write-Host "🏁 Frontend Apex prêt à être déployé sur Render."
Write-Host "👉 Vérifiez que le dossier 'dist' ou 'build' est apparu dans frontend/"
Write-Host "👉 Ensuite, sur Render : connectez ce dossier et déployez."
