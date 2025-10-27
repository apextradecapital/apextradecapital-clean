$ErrorActionPreference="Stop"

# === AUTO APEX BACKEND SYNC ===
$root = Get-Location
$be   = Join-Path $root "backend"
$sv   = Join-Path $be   "server.js"

if (!(Test-Path $be)) { throw "backend/ introuvable. Ouvre PowerShell à la racine du projet." }
if (!(Test-Path $sv)) { New-Item -ItemType File -Path $sv -Force | Out-Null }

# Backup
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$bak   = Join-Path $be "server.$stamp.bak.js"
Copy-Item $sv $bak -Force

# Deps
Push-Location $be
npm i express cors helmet dotenv better-sqlite3 ws nodemailer bcrypt --no-fund --no-audit
Pop-Location

# Write server.js
@'
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import { WebSocketServer } from "ws";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import crypto from "crypto";

dotenv.config();

// === CONFIG ===
const PORT = Number(process.env.PORT || 3000);
const DATA = process.env.DB_FILE || path.resolve("data/apextrade.db");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const WS_PORT = Number(process.env.WS_PORT || 3001);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.MAIL_USER;
const ADMIN_KEY = process.env.ADMIN_KEY || "apex_supermaster_2025";
const USD_RATE = Number(process.env.USD_RATE || 0);
const PHONE_WA = (process.env.WHATSAPP_NUMBER || "+16265333367").replace(/[^0-9]/g,"");

// === APP ===
const app = express();
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN==="*" ? true : CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// === FS & DB ===
const dir = path.dirname(DATA);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const db = new Database(DATA);

// Schema
db.prepare(`CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  first_name TEXT, last_name TEXT,
  country_code TEXT, dial TEXT, phone TEXT,
  created_at TEXT
);`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS investments(
  id TEXT PRIMARY KEY,
  user_id TEXT,
  offer TEXT, amount INTEGER,
  status TEXT,
  start_at TEXT,
  duration_days INTEGER,
  fee_percent REAL, fee_fixed REAL,
  rate REAL,
  created_at TEXT, updated_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT, actor TEXT, type TEXT, payload TEXT
);`).run();
db.prepare(`CREATE TABLE IF NOT EXISTS otps(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investment_id TEXT, user_id TEXT,
  otp_hash TEXT, expires_at TEXT, consumed INTEGER DEFAULT 0
);`).run();

// Mailer
const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.MAIL_PORT || 465),
  secure: (process.env.MAIL_PORT || "465") === "465",
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

// WS Admin
const wss = new WebSocketServer({ port: WS_PORT });
const wsClients = new Set();
wss.on("connection", (ws) => { wsClients.add(ws); ws.on("close", ()=>wsClients.delete(ws)); });
function broadcast(msg){
  const data = JSON.stringify({ topic:"events", ...msg });
  for (const ws of wsClients) { try { ws.send(data); } catch {} }
}

// Helpers
const nowISO = () => new Date().toISOString();
function logEvent(actor, type, payload = {}){
  const ts = nowISO();
  db.prepare("INSERT INTO events(ts,actor,type,payload) VALUES (?,?,?,?)").run(ts, actor, type, JSON.stringify(payload));
  broadcast({ ts, actor, type, payload });
  if (ADMIN_EMAIL && process.env.MAIL_USER){
    const text = `Date: ${ts}\nType: ${type}\nActor: ${actor}\nPayload:\n${JSON.stringify(payload,null,2)}`;
    mailer.sendMail({ from:`Apex <${process.env.MAIL_USER}>`, to:ADMIN_EMAIL, subject:`[Apex] ${type}`, text }).catch(()=>{});
  }
}
function guardAdmin(req,res,next){
  const k = req.headers["x-admin-key"];
  if (k && k === ADMIN_KEY) return next();
  res.status(401).json({ ok:false, error:"unauthorized" });
}
function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
function computeState(inv){
  const principal = Number(inv.amount||0);
  const durationMs = (inv.duration_days||0)*24*3600*1000;
  let progress = 0;
  if (inv.start_at && durationMs>0){
    progress = clamp(Math.round((Date.now() - new Date(inv.start_at).getTime())/durationMs*100), 0, 100);
  }
  const rate = Number(inv.rate ?? 0.40);
  const accrued = +(principal * rate * (progress/100));
  const fee_percent = Number(inv.fee_percent||0);
  const fee_fixed = Number(inv.fee_fixed||0);
  const fees_applied = +(principal*fee_percent/100) + fee_fixed;
  const net = +(principal + accrued - fees_applied);
  const usd = USD_RATE ? +(net*USD_RATE) : 0;
  return { principal, progress, accrued, fee_percent, fee_fixed, fees_applied, net, usd_rate:USD_RATE, net_usd:usd };
}

// === ROUTES PUBLIC ===

// Register
app.post("/api/register",(req,res)=>{
  const { firstName, lastName, countryCode, dial, phone } = req.body||{};
  if (!firstName || !lastName || !countryCode || !dial || !phone) return res.status(400).json({ ok:false, error:"missing_fields" });
  const id = "usr_" + crypto.randomUUID();
  db.prepare(`INSERT INTO users(id,first_name,last_name,country_code,dial,phone,created_at) VALUES (?,?,?,?,?,?,?)`)
    .run(id, firstName, lastName, countryCode, dial, phone, nowISO());
  logEvent(`user:${id}`, "user_registered", { id, firstName, lastName, countryCode, dial, phone });
  res.json({ ok:true, userId:id });
});

// Create investment (pending)
app.post("/api/investments",(req,res)=>{
  const { userId, offer, amount, durationDays, rate } = req.body||{};
  if (!userId || !offer || !amount) return res.status(400).json({ ok:false, error:"missing_fields" });
  const id = "inv_" + crypto.randomUUID();
  const now = nowISO();
  db.prepare(`INSERT INTO investments(id,user_id,offer,amount,status,start_at,duration_days,fee_percent,fee_fixed,rate,created_at,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, userId, offer, Number(amount), "pending", null, durationDays?Number(durationDays):4, null, null, rate??0.40, now, now);
  logEvent(`user:${userId}`, "invest_created", { investmentId:id, offer, amount:Number(amount) });
  res.json({ ok:true, investmentId:id, status:"pending" });
});

// Confirm -> generate OTP (to admin only)
app.post("/api/investments/:id/confirm", async (req,res)=>{
  const invId = req.params.id;
  const inv = db.prepare("SELECT * FROM investments WHERE id=?").get(invId);
  if (!inv) return res.status(404).json({ ok:false, error:"not_found" });

  // OTP
  const otp = String(Math.floor(100000 + Math.random()*900000));
  const otpHash = await bcrypt.hash(otp, 10);
  const ttlMin = Number(process.env.OTP_TTL_MIN || 15);
  const exp = new Date(Date.now()+ttlMin*60000).toISOString();
  db.prepare("INSERT INTO otps(investment_id,user_id,otp_hash,expires_at,consumed) VALUES (?,?,?,?,0)")
    .run(invId, inv.user_id, otpHash, exp);

  db.prepare("UPDATE investments SET status='confirmed', updated_at=? WHERE id=?").run(nowISO(), invId);
  logEvent("system","invest_confirmed",{ investmentId:invId, userId:inv.user_id, offer:inv.offer, amount:inv.amount, otp_masked: otp.replace(/\d{3}$/,'***') });

  // Mail OTP to admin
  if (ADMIN_EMAIL && process.env.MAIL_USER){
    const text = [
      "CONFIRMATION INVESTISSEMENT",
      `InvestmentID: ${invId}`,
      `UserID: ${inv.user_id}`,
      `Montant: ${inv.amount}`,
      `OTP (ADMIN): ${otp}`,
      `Expire dans: ${ttlMin} min`
    ].join("\n");
    mailer.sendMail({ from:`Apex <${process.env.MAIL_USER}>`, to:ADMIN_EMAIL, subject:`[Apex] OTP ${invId}`, text }).catch(()=>{});
  }
  res.json({ ok:true, status:"otp_sent_admin" });
});

// Verify OTP -> start running
app.post("/api/investments/:id/verify-otp", async (req,res)=>{
  const { otp } = req.body||{};
  if (!otp) return res.status(400).json({ ok:false, error:"missing_otp" });
  const invId = req.params.id;
  const row = db.prepare("SELECT * FROM otps WHERE investment_id=? AND consumed=0 ORDER BY id DESC LIMIT 1").get(invId);
  if (!row) return res.status(400).json({ ok:false, error:"otp_not_found" });
  if (new Date(row.expires_at) < new Date()) return res.status(400).json({ ok:false, error:"otp_expired" });
  const ok = await bcrypt.compare(otp, row.otp_hash);
  if (!ok) return res.status(400).json({ ok:false, error:"otp_invalid" });

  db.prepare("UPDATE otps SET consumed=1 WHERE id=?").run(row.id);
  const now = nowISO();
  db.prepare("UPDATE investments SET status='running', start_at=?, updated_at=? WHERE id=?").run(now, now, invId);
  logEvent("system","invest_started",{ investmentId:invId });
  res.json({ ok:true, status:"running" });
});

// Balance
app.get("/api/investments/:id/balance",(req,res)=>{
  const inv = db.prepare("SELECT * FROM investments WHERE id=?").get(req.params.id);
  if (!inv) return res.status(404).json({ ok:false, error:"not_found" });
  const s = computeState(inv);
  res.json({ ok:true, investmentId:inv.id, principal:s.principal, progress:s.progress, accrued:s.accrued,
             fee_percent:s.fee_percent, fee_fixed:s.fee_fixed, fees_applied:s.fees_applied,
             net_balance:s.net, currency:"HTG", usd_rate:s.usd_rate, net_balance_usd:s.net_usd });
});

// WhatsApp helper
app.post("/api/whatsapp-link",(req,res)=>{
  const { context, userId } = req.body||{};
  const dict = {
    register: "Bonjour, je souhaite créer mon compte.",
    invest:   "Bonjour, je souhaite réaliser un investissement.",
    withdraw: "Bonjour, je souhaite retirer mes bénéfices.",
    help:     "Bonjour, j’ai besoin d’assistance."
  };
  const msg = dict[context||"help"];
  const url = `https://wa.me/${PHONE_WA}?text=${encodeURIComponent(msg + (userId? " (User:"+userId+")": ""))}`;
  res.json({ ok:true, url });
});

// Events & Health
app.get("/api/events",(req,res)=>{
  const rows = db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT 200").all();
  const parsed = rows.map(r=>({ ...r, payload: (()=>{try{return JSON.parse(r.payload||"{}")}catch{return{}}})() }));
  res.json({ ok:true, events: parsed });
});
app.get("/api/health",(_req,res)=> res.json({ ok:true, ts: nowISO() }));

// === ROUTES ADMIN (x-admin-key) ===
app.post("/api/admin/fees", guardAdmin, (req,res)=>{
  const { investmentId, feePercent, feeFixed } = req.body||{};
  if (!investmentId) return res.status(400).json({ ok:false, error:"missing_investmentId" });
  db.prepare("UPDATE investments SET fee_percent=?, fee_fixed=?, updated_at=? WHERE id=?")
    .run(feePercent ?? null, feeFixed ?? null, nowISO(), investmentId);
  logEvent("admin:system","fees_set",{ investmentId, feePercent, feeFixed });
  res.json({ ok:true });
});
app.post("/api/admin/adjust-balance", guardAdmin, (req,res)=>{
  const { investmentId, newPrincipal } = req.body||{};
  if (!investmentId || newPrincipal==null) return res.status(400).json({ ok:false, error:"missing_fields" });
  db.prepare("UPDATE investments SET amount=?, updated_at=? WHERE id=?").run(Number(newPrincipal), nowISO(), investmentId);
  logEvent("admin:system","principal_adjusted",{ investmentId, newPrincipal:Number(newPrincipal) });
  res.json({ ok:true });
});
app.post("/api/admin/pause", guardAdmin, (req,res)=>{
  const { investmentId } = req.body||{};
  if (!investmentId) return res.status(400).json({ ok:false, error:"missing_investmentId" });
  db.prepare("UPDATE investments SET status='paused', updated_at=? WHERE id=?").run(nowISO(), investmentId);
  logEvent("admin:system","invest_paused",{ investmentId });
  res.json({ ok:true, status:"paused" });
});
app.post("/api/admin/resume", guardAdmin, (req,res)=>{
  const { investmentId } = req.body||{};
  if (!investmentId) return res.status(400).json({ ok:false, error:"missing_investmentId" });
  db.prepare("UPDATE investments SET status='running', updated_at=? WHERE id=?").run(nowISO(), investmentId);
  logEvent("admin:system","invest_resumed",{ investmentId });
  res.json({ ok:true, status:"running" });
});
app.post("/api/admin/cancel", guardAdmin, (req,res)=>{
  const { investmentId } = req.body||{};
  if (!investmentId) return res.status(400).json({ ok:false, error:"missing_investmentId" });
  db.prepare("UPDATE investments SET status='cancelled', updated_at=? WHERE id=?").run(nowISO(), investmentId);
  logEvent("admin:system","invest_cancelled",{ investmentId });
  res.json({ ok:true, status:"cancelled" });
});

// Bulk admin
app.post("/api/admin/stop-all", guardAdmin, (_req,res)=>{
  db.prepare("UPDATE investments SET status='paused', updated_at=? WHERE status IN ('running','confirmed')").run(nowISO());
  logEvent("admin:system","all_paused",{});
  res.json({ ok:true });
});
app.post("/api/admin/resume-all", guardAdmin, (_req,res)=>{
  db.prepare("UPDATE investments SET status='running', updated_at=? WHERE status='paused'").run(nowISO());
  logEvent("admin:system","all_resumed",{});
  res.json({ ok:true });
});
app.post("/api/admin/clear-expired-otp", guardAdmin, (_req,res)=>{
  db.prepare("DELETE FROM otps WHERE consumed=1 OR datetime(expires_at) < datetime('now')").run();
  logEvent("admin:system","otp_cleared",{});
  res.json({ ok:true });
});

// Dashboard minimal HTML (admin)
app.get("/admin/dashboard",(req,res)=>{
  if (req.query.key !== ADMIN_KEY) return res.status(401).send("unauthorized");
  const users = db.prepare("SELECT COUNT(*) c FROM users").get().c;
  const invs = db.prepare("SELECT COUNT(*) c FROM investments").get().c;
  const running = db.prepare("SELECT COUNT(*) c FROM investments WHERE status='running'").get().c;
  const pending = db.prepare("SELECT COUNT(*) c FROM investments WHERE status='pending'").get().c;
  const finished = db.prepare("SELECT COUNT(*) c FROM investments WHERE status='finished'").get().c;
  const last = db.prepare("SELECT ts,type,payload FROM events ORDER BY id DESC LIMIT 10").all()
    .map(r=>`<li>[${r.ts}] <b>${r.type}</b> ${r.payload}</li>`).join("");
  res.send(`
  <html><head><meta charset="utf-8"><title>Apex Admin</title>
  <style>body{font-family:system-ui,Segoe UI,Arial;background:#0f172a;color:#fff;padding:24px}
  .card{background:#111827;border-radius:16px;padding:16px;margin-bottom:16px}
  h1{color:#D4AF37}</style></head>
  <body>
    <h1>Apex Admin</h1>
    <div class="card">Users: ${users} | Investments: ${invs} | Running: ${running} | Pending: ${pending} | Finished: ${finished}</div>
    <div class="card"><b>Derniers événements</b><ul>${last}</ul></div>
  </body></html>`);
});

// Scheduler: maintenance every 15 minutes
setInterval(()=>{
  // finish investments whose duration is over
  const list = db.prepare("SELECT * FROM investments WHERE status='running' AND start_at IS NOT NULL").all();
  const now = Date.now();
  for (const inv of list){
    const end = new Date(inv.start_at).getTime() + (inv.duration_days||0)*24*3600*1000;
    if (now >= end){
      db.prepare("UPDATE investments SET status='finished', updated_at=? WHERE id=?").run(nowISO(), inv.id);
      logEvent("system","invest_finished",{ investmentId: inv.id });
    }
  }
  // clear expired otps
  db.prepare("DELETE FROM otps WHERE consumed=1 OR datetime(expires_at) < datetime('now')").run();
}, 15*60*1000);

// Start HTTP
app.listen(PORT, ()=> console.log(`Apex backend on :${PORT} ; WS:${WS_PORT}`));
'@ | Set-Content $sv -Encoding UTF8

Write-Host "OK. backend/server.js reconstruit."
Write-Host "Vars Render requises:"
Write-Host "  MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, ADMIN_EMAIL"
Write-Host "  CORS_ORIGIN, DB_FILE, PORT=3000, WS_PORT=3001, USD_RATE, WHATSAPP_NUMBER, ADMIN_KEY"
