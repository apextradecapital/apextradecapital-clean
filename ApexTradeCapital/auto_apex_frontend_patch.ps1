$ErrorActionPreference = "Stop"

# === CONFIG ===
$root = Get-Location
$fe   = Join-Path $root "frontend"
$src  = Join-Path $fe "src"
$cmp  = Join-Path $src "components"
$svc  = Join-Path $src "services"
$pub  = Join-Path $fe "public"
$envf = Join-Path $fe ".env"

# Backend URLs (adjust if your Render URL differs)
$VITE_HTTP = $Env:VITE_BACKEND_HTTP_URL
$VITE_WS   = $Env:VITE_BACKEND_WS_URL
if (-not $VITE_HTTP) { $VITE_HTTP = "https://apex-backend-266x.onrender.com" }
if (-not $VITE_WS)   { $VITE_WS   = "wss://apex-backend-266x.onrender.com" }

Write-Host "== Apex Frontend Patch =="

# === Checks ===
if (!(Test-Path $fe)) { throw "Dossier 'frontend' introuvable à la racine: $($fe)" }
if (!(Test-Path $src)) { New-Item -ItemType Directory -Path $src | Out-Null }
if (!(Test-Path $cmp)) { New-Item -ItemType Directory -Path $cmp | Out-Null }
if (!(Test-Path $svc)) { New-Item -ItemType Directory -Path $svc | Out-Null }
if (!(Test-Path $pub)) { New-Item -ItemType Directory -Path $pub | Out-Null }

# === .env update ===
$envLines = @(
  "VITE_BACKEND_HTTP_URL=$VITE_HTTP",
  "VITE_BACKEND_WS_URL=$VITE_WS"
)
if (!(Test-Path $envf)) {
  Set-Content -Path $envf -Value ($envLines -join "`n") -Encoding UTF8
} else {
  $current = Get-Content $envf -Raw
  foreach ($l in $envLines) {
    $k = $l.Split("=")[0]
    if ($current -match "^\s*$k\s*=") {
      $current = [regex]::Replace($current, "^\s*$([regex]::Escape($k))\s*=.*$", $l, "Multiline")
    } else {
      $current = ($current.TrimEnd() + "`n" + $l + "`n")
    }
  }
  Set-Content -Path $envf -Value $current -Encoding UTF8
}
Write-Host ".env mis à jour."

# === InvestmentProgress.tsx ===
$investmentProgressPath = Join-Path $cmp "InvestmentProgress.tsx"
$investmentProgress = @'
import React, { useEffect, useMemo, useState } from "react";

type BalanceResp = {
  ok: boolean;
  investmentId: string;
  principal: number;
  progress: number;
  accrued: number;
  fee_percent: number | null;
  fee_fixed: number | null;
  fees_applied: number;
  net_balance: number;
  currency: string;
  usd_rate: number;
  net_balance_usd: number;
};

const httpBase = (import.meta as any).env.VITE_BACKEND_HTTP_URL || "http://localhost:3000";
const wsUrl    = (import.meta as any).env.VITE_BACKEND_WS_URL  || "ws://localhost:3001";

export default function InvestmentProgress({ investmentId }: { investmentId: string }) {
  const [data, setData] = useState<BalanceResp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  async function fetchBalance() {
    try {
      const r = await fetch(`${httpBase}/api/investments/${investmentId}/balance`);
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "balance_error");
      setData(j);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBalance();
    const t = setInterval(fetchBalance, 10000);
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (m) => {
        try {
          const msg = JSON.parse(m.data);
          if (msg.topic === "events") {
            if (msg?.payload?.investmentId === investmentId || msg?.payload?.investment_id === investmentId) {
              fetchBalance();
            }
          }
        } catch {}
      };
    } catch {}
    return () => { clearInterval(t); try { ws && ws.close(); } catch {} };
  }, [investmentId]);

  const pct = useMemo(() => Math.min(100, Math.max(0, data?.progress ?? 0)), [data]);

  if (loading) return <div style={{padding:16, borderRadius:16, background:"#fff"}}>Chargement…</div>;
  if (err) return <div style={{padding:16, borderRadius:16, background:"#fee2e2"}}>Erreur: {err}</div>;
  if (!data) return null;

  const C = 2*Math.PI*54;
  const dash = `${Math.round(C)}`;
  const offset = `${Math.round(C * (1 - pct/100))}`;

  return (
    <div style={{display:"grid", gap:24, gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))"}}>
      <div style={{padding:24, borderRadius:20, color:"#fff", background:"linear-gradient(135deg,#0f1c3d,#1e3a8a)"}}>
        <div style={{opacity:.7, fontSize:12, letterSpacing:1}}>Progression</div>
        <div style={{display:"flex",alignItems:"center",gap:20, marginTop:16}}>
          <div style={{position:"relative", width:112, height:112}}>
            <svg viewBox="0 0 120 120" style={{width:112, height:112, transform:"rotate(-90deg)"}}>
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#D4AF37" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={dash} strokeDashoffset={offset}>
                <animate attributeName="stroke-dashoffset" from={dash} to={offset} dur="0.8s" fill="freeze" />
              </circle>
            </svg>
            <div style={{position:"absolute", inset:0, display:"grid", placeItems:"center"}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:24, fontWeight:700}}>{pct}%</div>
                <div style={{fontSize:11, opacity:.8}}>en cours</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{opacity:.7, fontSize:12}}>Montant initial</div>
            <div style={{fontSize:20, fontWeight:700}}>{formatMoney(data.principal)} HTG</div>
            <div style={{marginTop:12, opacity:.7, fontSize:12}}>Gains cumulés</div>
            <div style={{fontSize:18}}>{formatMoney(data.accrued)} HTG</div>
            <div style={{marginTop:12, opacity:.7, fontSize:12}}>Frais</div>
            <div style={{fontSize:18}}>{formatMoney(data.fees_applied)} HTG</div>
          </div>
        </div>
      </div>

      <div style={{padding:24, borderRadius:20, background:"#fff", boxShadow:"0 1px 2px rgba(0,0,0,.08)"}}>
        <div style={{opacity:.6, fontSize:12, letterSpacing:1}}>Solde net</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginTop:16}}>
          <div style={{padding:16, borderRadius:12, background:"#f6f6f6"}}>
            <div style={{opacity:.6, fontSize:12}}>HTG</div>
            <div style={{fontSize:24, fontWeight:700}}>{formatMoney(data.net_balance)}</div>
          </div>
          <div style={{padding:16, borderRadius:12, background:"#f6f6f6"}}>
            <div style={{opacity:.6, fontSize:12}}>USD</div>
            <div style={{fontSize:24, fontWeight:700}}>{data.usd_rate ? formatMoney(data.net_balance_usd) : "—"}</div>
          </div>
        </div>
        <div style={{marginTop:16, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{opacity:.7, fontSize:14}}>Investment ID</span>
          <code style={{fontSize:12, background:"#f1f1f1", padding:"2px 6px", borderRadius:6}}>{data.investmentId}</code>
        </div>
      </div>
    </div>
  );
}

function formatMoney(n: number) {
  try { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n || 0); }
  catch { return String(Math.round(n || 0)); }
}
'@
Set-Content -Path $investmentProgressPath -Value $investmentProgress -Encoding UTF8
Write-Host "Component: InvestmentProgress.tsx OK"

# === live.ts ===
$livePath = Join-Path $svc "live.ts"
$live = @'
export function subscribeEvents(onMsg: (e:any)=>void) {
  const wsUrl = (import.meta as any).env.VITE_BACKEND_WS_URL || "ws://localhost:3001";
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (m) => {
    try {
      const data = JSON.parse(m.data);
      if (data.topic === "events") onMsg(data);
    } catch {}
  };
  return () => ws.close();
}
'@
Set-Content -Path $livePath -Value $live -Encoding UTF8
Write-Host "Service: live.ts OK"

# === WhatsAppFloat.tsx ===
$waPath = Join-Path $cmp "WhatsAppFloat.tsx"
$wa = @'
import React from "react";

const phone = "+16265333367"; // déjà dans ton .env backend, ici lien direct wa.me
const wa = "https://wa.me/" + phone.replace(/[^0-9]/g,"");

export default function WhatsAppFloat() {
  const size = 56;
  return (
    <a
      href={wa}
      target="_blank"
      rel="noreferrer"
      aria-label="Contacter WhatsApp"
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        width: size,
        height: size,
        background: "#25D366",
        borderRadius: "9999px",
        display: "grid",
        placeItems: "center",
        color: "white",
        boxShadow: "0 8px 24px rgba(37,211,102,.45)"
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
        <path d="M20.52 3.48A11.8 11.8 0 0012.06 0C5.76 0 .64 5.12.64 11.43c0 2.01.52 3.93 1.5 5.64L0 24l7.13-2.09c1.64.9 3.5 1.37 5.4 1.37h.01c6.3 0 11.43-5.13 11.43-11.43 0-3.05-1.19-5.92-3.45-8.16zM12.54 21.3h-.01c-1.66 0-3.28-.45-4.69-1.3l-.34-.2-4.23 1.24 1.26-4.12-.22-.34a9.5 9.5 0 01-1.46-5.15c0-5.25 4.27-9.52 9.52-9.52 2.54 0 4.93.99 6.72 2.79a9.45 9.45 0 012.79 6.72c0 5.25-4.27 9.52-9.52 9.52zm5.46-7.14c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.5-1.77-1.68-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.91-2.22-.24-.58-.48-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1-1.04 2.45s1.07 2.84 1.22 3.04c.15.2 2.11 3.22 5.1 4.52.71.31 1.27.5 1.7.64.71.23 1.36.2 1.88.12.57-.08 1.77-.72 2.02-1.41.25-.7.25-1.3.17-1.43-.08-.13-.27-.2-.57-.35z"/>
      </svg>
    </a>
  );
}
'@
Set-Content -Path $waPath -Value $wa -Encoding UTF8
Write-Host "Component: WhatsAppFloat.tsx OK"

# === Header/App logo injection ===
$appTsx = Join-Path $src "App.tsx"
$hdrTsx = Join-Path $cmp "Header.tsx"

function Ensure-Logo-In-File([string]$filePath) {
  if (!(Test-Path $filePath)) { return $false }
  $code = Get-Content $filePath -Raw
  if ($code -notmatch "logo\.png") {
    if ($code -match "export default function") {
      $code = $code -replace "export default function\s+([A-Za-z0-9_]+)\s*\(", "import React from 'react';`nimport logo from '/logo.png';`nexport default function `$1("
    } elseif ($code -match "function\s+[A-Za-z0-9_]+\(" -and $code -notmatch "import logo from '/logo.png'") {
      $code = "import React from 'react';`nimport logo from '/logo.png';`n" + $code
    } elseif ($code -notmatch "import logo from '/logo.png'") {
      $code = "import React from 'react';`nimport logo from '/logo.png';`n" + $code
    }
    $code = $code -replace "return\s*\(", "return (`n  <div style={{background:'#1e3a8a',padding:'10px 16px',display:'flex',alignItems:'center',gap:12}}>`n    <img src={logo} alt='Apex' style={{height:32}} />`n    <span style={{color:'#D4AF37',fontWeight:700,letterSpacing:1}}>Apex Trade Capital</span>`n  </div>`n  "
  }
  Set-Content -Path $filePath -Value $code -Encoding UTF8
  return $true
}

$injected = $false
if (Test-Path $hdrTsx) { $injected = (Ensure-Logo-In-File $hdrTsx) }
if (-not $injected -and (Test-Path $appTsx)) { $injected = (Ensure-Logo-In-File $appTsx) }
if (-not $injected) {
  $minimal = @'
import React from "react";
import WhatsAppFloat from "./components/WhatsAppFloat";
export default function App(){
  return (
    <div>
      <div style={{background:"#1e3a8a",padding:"10px 16px",display:"flex",alignItems:"center",gap:12}}>
        <img src="/logo.png" alt="Apex" style={{height:32}} />
        <span style={{color:"#D4AF37",fontWeight:700,letterSpacing:1}}>Apex Trade Capital</span>
      </div>
      <div style={{padding:24}}>Bienvenue sur Apex Trade Capital</div>
      <WhatsAppFloat/>
    </div>
  );
}
'@
  Set-Content -Path $appTsx -Value $minimal -Encoding UTF8
}

Write-Host "Logo & Header intégrés."

# Ensure WhatsAppFloat is referenced in App if exists
if (Test-Path $appTsx) {
  $app = Get-Content $appTsx -Raw
  if ($app -notmatch "WhatsAppFloat") {
    $app = "import WhatsAppFloat from `"./components/WhatsAppFloat`";`n" + $app + "`n<WhatsAppFloat/>"
    Set-Content -Path $appTsx -Value $app -Encoding UTF8
  }
}

# === npm build ===
Push-Location $fe
try {
  if (Test-Path "package-lock.json") { npm ci } else { npm install }
  if (Test-Path "package.json") { npm run build }
} finally { Pop-Location }

Write-Host "✅ Frontend Apex prêt. Dossier build (ex: dist/) disponible."
