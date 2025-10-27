$ErrorActionPreference="Stop"

# === APEX DEPLOY CENTER (mini) ===
function Banner {
@"
========================================
        A P E X   D E P L O Y
========================================
"@ | Write-Host -ForegroundColor Yellow
}

Banner

# Commit message
$msg = Read-Host "Message de commit (Enter pour auto)"
if ([string]::IsNullOrWhiteSpace($msg)) { $msg = "auto deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" }

# Git add/commit/push
Write-Host "`nGit → add/commit/push..." -ForegroundColor Cyan
git add .
git commit -m "$msg" 2>$null
git push origin master

Write-Host "`nGitHub synchronisé." -ForegroundColor Green
Write-Host "Ouvre Render et déclenche le redeploy si Auto Deploy est OFF." -ForegroundColor Yellow
