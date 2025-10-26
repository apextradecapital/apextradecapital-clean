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

  if (loading) return <div className="w-full p-6 rounded-2xl bg-white/70 dark:bg-neutral-900 shadow"><p className="text-sm opacity-70">Chargement…</p></div>;
  if (err) return <div className="w-full p-6 rounded-2xl bg-red-50 dark:bg-red-900/30 border border-red-400"><p className="font-medium text-red-700 dark:text-red-200">Erreur</p><p className="text-sm opacity-80">{err}</p></div>;
  if (!data) return null;

  return (
    <div className="w-full grid gap-6 md:grid-cols-2">
      <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0f1c3d] to-[#1e3a8a] text-white shadow">
        <p className="text-xs uppercase tracking-widest opacity-70">Progression</p>
        <div className="mt-4 flex items-center gap-5">
          <div className="relative w-28 h-28">
            <svg viewBox="0 0 120 120" className="w-28 h-28 rotate-[-90deg]">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
              <circle cx="60" cy="60" r="54" fill="none" stroke="#D4AF37" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${Math.round(2*Math.PI*54)}`}
                strokeDashoffset={`${Math.round(2*Math.PI*54 * (1 - pct/100))}`}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{pct}%</div>
                <div className="text-[11px] opacity-80">en cours</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-xs opacity-70">Montant initial</div>
            <div className="text-xl font-semibold">{formatMoney(data.principal)} HTG</div>

            <div className="mt-3 text-xs opacity-70">Gains cumulés</div>
            <div className="text-lg">{formatMoney(data.accrued)} HTG</div>

            <div className="mt-3 text-xs opacity-70">Frais</div>
            <div className="text-lg">
              {formatMoney(data.fees_applied)} HTG
              <span className="opacity-70 text-xs"> ({data.fee_percent ?? 0}% + {formatMoney(data.fee_fixed ?? 0)})</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white shadow ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800">
        <p className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Solde net</p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="text-xs opacity-60">HTG</div>
            <div className="text-2xl font-bold">{formatMoney(data.net_balance)}</div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800">
            <div className="text-xs opacity-60">USD</div>
            <div className="text-2xl font-bold">{data.usd_rate ? formatMoney(data.net_balance_usd) : "—"}</div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm opacity-70">Investment ID</span>
          <code className="text-xs px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800">{data.investmentId}</code>
        </div>
      </div>
    </div>
  );
}

function formatMoney(n: number) {
  try { return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n || 0); }
  catch { return String(Math.round(n || 0)); }
}
