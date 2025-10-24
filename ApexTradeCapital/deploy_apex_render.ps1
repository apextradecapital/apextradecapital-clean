param([string]$RepoName = 'apextrade-project-001',[string]$FrontendURL = 'https://apextrade-frontend.onrender.com'])
Write-Host '=== Déploiement ApexTradeCapital (GitHub + Render manuel) ==='
Write-Host '1) Connecte ton dépôt GitHub dans Render.'
Write-Host '   - Backend: Root=backend, Build=npm ci || npm install, Start=node server.js'
Write-Host '   - Frontend: Root=frontend, Build=npm ci || npm install && npm run build, Publish=dist'
Write-Host '   - Env Vars: voir .env.example'
