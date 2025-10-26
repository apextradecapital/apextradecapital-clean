# === AUTO APEX STABLE PATCH ===
$ErrorActionPreference = "Stop"
$root = Get-Location
$backend = Join-Path $root "backend"
$serverFile = Join-Path $backend "server.js"

if (!(Test-Path $backend)) { throw "Dossier backend introuvable." }
if (!(Test-Path $serverFile)) { throw "Fichier server.js introuvable." }

# Sauvegarde
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path $backend "server_backup_$stamp.js"
Copy-Item $serverFile $backup -Force
Write-Host "🟢 Sauvegarde créée: $backup"

# Installer dépendances
Push-Location $backend
npm install express cors helmet dotenv better-sqlite3 ws nodemailer bcrypt node-fetch@2 --no-fund --no-audit
Pop-Location

# Nouveau contenu de server.js (propre et testé)
@'
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import nodemailer from "nodemailer";
import { WebSocketServer } from "ws";
import bcrypt from "bcrypt";
import crypto from "crypto";
import fs from "fs";
import path from "path";

dotenv.config();
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// === BASE DE DONNÉES ===
const dataDir = path.resolve("data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "apextrade.db"));

// Tables propres
db.prepare(`CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  country_code TEXT,
  dial TEXT,
  phone TEXT,
  email TEXT,
  password_hash TEXT,
  created_at TEXT
);`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS investments(
  id TEXT PRIMARY KEY,
  user_id TEXT,
  offer TEXT,
  amount INTEGER,
  status TEXT,
  created_at TEXT,
  updated_at TEXT
);`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT,
  actor TEXT,
  type TEXT,
  payload TEXT
);`).run();

// === MAIL CONFIG ===
const ADMIN = process.env.ADMIN_EMAIL;
const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: true,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

// === WEBSOCKET ===
const wss = new WebSocketServer({ port: process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001 });
const wsClients = new Set();
wss.on("connection", ws => {
  wsClients.add(ws);
  ws.on("close", () => wsClients.delete(ws));
});
function broadcast(msg) {
  const data = JSON.stringify({ topic: "events", ...msg });
  for (const ws of wsClients) { try { ws.send(data); } catch {} }
}

// === LOGGER + MAIL ===
function logEvent(actor, type, payload = {}) {
  const ts = new Date().toISOString();
  db.prepare("INSERT INTO events(ts, actor, type, payload) VALUES (?, ?, ?, ?)").run(ts, actor, type, JSON.stringify(payload));
  broadcast({ ts, actor, type, payload });
  if (ADMIN && process.env.MAIL_USER) {
    const body = `Date: ${ts}\nType: ${type}\nActeur: ${actor}\nDétails:\n${JSON.stringify(payload, null, 2)}`;
    mailer.sendMail({
      from: `"Apex Trade Capital" <${process.env.MAIL_USER}>`,
      to: ADMIN,
      subject: `[Apex] ${type}`,
      text: body
    }).catch(()=>{});
  }
}

// === ROUTES ===

// 1️⃣ Création de compte simple
app.post("/api/register", (req, res) => {
  const { firstName, lastName, countryCode, dial, phone, email, password } = req.body || {};
  if (!firstName || !lastName || !countryCode || !dial || !phone) {
    return res.status(400).json({ ok:false, error:"missing_fields" });
  }
  const id = "usr_" + crypto.randomUUID();
  const hash = password ? bcrypt.hashSync(password, 10) : null;
  db.prepare("INSERT INTO users(id, first_name, last_name, country_code, dial, phone, email, password_hash, created_at) VALUES (?,?,?,?,?,?,?,?,?)")
    .run(id, firstName, lastName, countryCode, dial, phone, email || "", hash, new Date().toISOString());
  logEvent(`user:${id}`, "user_registered", { id, firstName, lastName, countryCode, dial, phone });
  res.json({ ok:true, userId:id });
});

// 2️⃣ Création d’investissement (pending)
app.post("/api/investments", (req, res) => {
  const { userId, offer, amount } = req.body || {};
  if (!userId || !offer || !amount) return res.status(400).json({ ok:false, error:"missing_fields" });
  const id = "inv_" + crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO investments(id,user_id,offer,amount,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
    .run(id, userId, offer, Number(amount), "pending", now, now);
  logEvent(`user:${userId}`, "invest_created", { investmentId:id, offer, amount:Number(amount) });
  res.json({ ok:true, investmentId:id, status:"pending" });
});

// 3️⃣ Confirmation investissement (OTP admin)
app.post("/api/investments/:id/confirm", (req, res) => {
  const invId = req.params.id;
  const inv = db.prepare("SELECT * FROM investments WHERE id=?").get(invId);
  if (!inv) return res.status(404).json({ ok:false, error:"not_found" });

  const otp = (Math.floor(100000 + Math.random()*900000)).toString();
  const now = new Date().toISOString();
  db.prepare("UPDATE investments SET status='confirmed', updated_at=? WHERE id=?").run(now, invId);
  logEvent("system", "invest_confirmed", { investmentId:invId, userId:inv.user_id, otp_masked: otp.replace(/\d{3}$/,'***') });

  // envoi mail admin OTP
  if (ADMIN && process.env.MAIL_USER) {
    const body = `CONFIRMATION INVESTISSEMENT\nDate : ${now}\nInvestmentID : ${invId}\nUserID : ${inv.user_id}\nOTP : ${otp}`;
    mailer.sendMail({
      from: `"Apex Trade Capital" <${process.env.MAIL_USER}>`,
      to: ADMIN,
      subject: `[Apex] OTP Confirmation ${invId}`,
      text: body
    }).catch(()=>{});
  }

  res.json({ ok:true, status:"otp_sent_admin" });
});

// 4️⃣ Retrait
app.post("/api/withdraw", (req, res) => {
  const { userId, amount } = req.body || {};
  if (!userId || !amount) return res.status(400).json({ ok:false, error:"missing_fields" });
  logEvent(`user:${userId}`, "withdraw_requested", { amount:Number(amount) });
  res.json({ ok:true, status:"requested" });
});

// 5️⃣ Paiement frais
app.post("/api/fees", (req, res) => {
  const { userId, investmentId, amount } = req.body || {};
  if (!userId || !investmentId || !amount) return res.status(400).json({ ok:false, error:"missing_fields" });
  logEvent(`user:${userId}`, "fees_paid", { investmentId, amount:Number(amount) });
  res.json({ ok:true });
});

// 6️⃣ Journal admin
app.get("/api/events", (req, res) => {
  const rows = db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT 200").all();
  res.json({ ok:true, events: rows.map(r => ({...r, payload: safe(r.payload) })) });
});
function safe(s){ try{return JSON.parse(s||"{}")}catch{return{}} }

app.get("/api/health", (req,res)=> res.json({ ok:true, ts:new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log(`🚀 Backend lancé sur le port ${PORT}`));
'@ | Set-Content $serverFile -Encoding UTF8

Write-Host "✅ Nouveau backend reconstruit avec succès."
Write-Host "➡️ Pour lancer: cd backend ; node server.js"
Write-Host "➡️ Configure sur Render: MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS, ADMIN_EMAIL"

