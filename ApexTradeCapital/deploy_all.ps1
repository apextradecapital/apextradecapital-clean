cd "C:\Users\Install\Desktop\ApexTradeCapital_clean_repo\ApexTradeCapital\frontend"
npm install
npm run build
git add .
git commit -m "auto deploy update $(Get-Date -Format 'dd/MM/yyyy HH:mm')"
git push origin master
Write-Host "✅ Déploiement envoyé automatiquement à Render"
