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

