# =========================================================
# AUTO PRIMEFX FULL – Backend + Frontend + Build + GitHub
# =========================================================
$ErrorActionPreference = "Stop"

# --- CONFIG ---
$PROJECT_ROOT = Get-Location
$BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$DATA_DIR = Join-Path $PROJECT_ROOT "data"
$UPLOADS_DIR = Join-Path $PROJECT_ROOT "uploads"
$ZIP_OUT = Join-Path $PROJECT_ROOT "primefx_ready.zip"
$NEW_APP_NAME = "PrimeFX"
$LOGO_NAME = "logo.png"   # Ton logo à placer à la racine du projet
# ----------------

function Ensure-Exists($p){ if (!(Test-Path $p)){ New-Item -ItemType Directory -Path $p | Out-Null } }

if (!(Test-Path $BACKEND_DIR)) { throw "backend/ introuvable" }
if (!(Test-Path $FRONTEND_DIR)) { throw "frontend/ introuvable" }

# --- BACKUP ---
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path $PROJECT_ROOT ("backup_"+$stamp)
New-Item -ItemType Directory -Path $backupDir | Out-Null
Copy-Item $BACKEND_DIR -Destination (Join-Path $backupDir "backend") -Recurse -Force
Copy-Item $FRONTEND_DIR -Destination (Join-Path $backupDir "frontend") -Recurse -Force
Write-Host "🗂️ Backup créé : $backupDir"

# --- STRUCTURES ---
Ensure-Exists $DATA_DIR
Ensure-Exists $UPLOADS_DIR

# --- INSTALL DEPENDANCES BACKEND ---
Push-Location $BACKEND_DIR
npm install express cors helmet dotenv better-sqlite3 ws nodemailer bcrypt --no-fund --no-audit
Pop-Location

# --- INSTALL DEPENDANCES FRONTEND ---
Push-Location $FRONTEND_DIR
npm install --no-fund --no-audit
Pop-Location

# --- RÉÉCRITURE DU BACKEND (server.js stable & complet) ---
$sv = Join-Path $BACKEND_DIR "server.js"
$sv_bak = Join-Path $BACKEND_DIR ("server.js.bak." + $stamp)
if (Test-Path $sv) { Copy-Item $sv $sv_bak -Force }
Write-Host "💾 Backup server.js -> $sv_bak"

$server_js = @'
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
app.use(express.json({ limit: "2mb" }));

const DATA_DIR = process.env.DATA_DIR || path.resolve("data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, "apextrade.db");
const db = new Database(DB_FILE);

db.prepare(`CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
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
  status TEXT,
  start_at TEXT,
  duration_days INTEGER,
  fee_percent REAL,
  fee_fixed REAL,
  rate REAL,
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

db.prepare(`CREATE TABLE IF NOT EXISTS otps(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investment_id TEXT,
  user_id TEXT,
  otp_hash TEXT,
  expires_at TEXT,
  consumed INTEGER DEFAULT 0
);`).run();

const ADMIN = process.env.ADMIN_EMAIL;
const mailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const wssPort = process.env.WS_PORT ? Number(process.env.WS_PORT) : 3001;
const wss = new WebSocketServer({ port: wssPort });
const wsClients = new Set();
wss.on("connection", ws => { wsClients.add(ws); ws.on("close", ()=>wsClients.delete(ws)); });
function broadcast(msg){ const data = JSON.stringify({ topic:"events", ...msg }); for (const ws of wsClients){ try{ws.send(data);}catch{}} }

function logEvent(actor, type, payload = {}) {
  const ts = new Date().toISOString();
  db.prepare("INSERT INTO events(ts,actor,type,payload) VALUES (?,?,?,?)").run(ts, actor, type, JSON.stringify(payload));
  broadcast({ ts, actor, type, payload });
  if (ADMIN && mailTransport) {
    const body = `Date: ${ts}\nType: ${type}\nActeur: ${actor}\n\n${JSON.stringify(payload,null,2)}`;
    mailTransport.sendMail({ from: process.env.SMTP_USER, to: ADMIN, subject: `[PrimeFX] ${type}`, text: body }).catch(()=>{});
  }
}

function nowISO(){ return new Date().toISOString(); }
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

function computeInvestmentState(inv){
  const principal = Number(inv.amount||0);
  const start = inv.start_at ? new Date(inv.start_at).getTime() : null;
  const durationMs = (inv.duration_days||0)*24*3600*1000;
  let progress = 0;
  if (start && durationMs>0){
    const now = Date.now();
    progress = clamp(Math.round(((now-start)/durationMs)*100),0,100);
  }
  const rate = Number(inv.rate||0.4);
  const accrued = principal * rate * (progress/100);
  const fee_percent = Number(inv.fee_percent||0);
  const fee_fixed = Number(inv.fee_fixed||0);
  const net = principal + accrued - (principal*fee_percent/100) - fee_fixed;
  return { principal, progress, accrued, net };
}

app.post("/api/register",(req,res)=>{
  const {firstName,lastName,countryCode,dial,phone}=req.body||{};
  if(!firstName||!lastName||!countryCode||!dial||!phone) return res.status(400).json({ok:false,error:"missing_fields"});
  const id="usr_"+crypto.randomUUID();
  db.prepare("INSERT INTO users(id,first_name,last_name,country_code,dial,phone,created_at) VALUES(?,?,?,?,?,?,?)").run(id,firstName,lastName,countryCode,dial,phone,nowISO());
  logEvent(`user:${id}`,"user_registered",{id,firstName,lastName});
  res.json({ok:true,userId:id});
});

app.post("/api/investments",(req,res)=>{
  const {userId,offer,amount,durationDays,rate}=req.body||{};
  if(!userId||!offer||!amount) return res.status(400).json({ok:false,error:"missing_fields"});
  const id="inv_"+crypto.randomUUID();
  const now=nowISO();
  db.prepare("INSERT INTO investments(id,user_id,offer,amount,status,start_at,duration_days,rate,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
    .run(id,userId,offer,amount,"pending",null,durationDays||4,rate||0.4,now,now);
  logEvent(`user:${userId}`,"invest_created",{investmentId:id});
  res.json({ok:true,investmentId:id,status:"pending"});
});

app.post("/api/investments/:id/confirm",async(req,res)=>{
  const invId=req.params.id;
  const inv=db.prepare("SELECT * FROM investments WHERE id=?").get(invId);
  if(!inv) return res.status(404).json({ok:false,error:"not_found"});
  const otp=String(Math.floor(100000+Math.random()*900000));
  const otpHash=await bcrypt.hash(otp,10);
  const exp=new Date(Date.now()+15*60000).toISOString();
  db.prepare("INSERT INTO otps(investment_id,user_id,otp_hash,expires_at) VALUES(?,?,?,?)").run(invId,inv.user_id,otpHash,exp);
  logEvent("system","invest_confirmed",{investmentId:invId,otp});
  if(ADMIN&&mailTransport){
    mailTransport.sendMail({from:process.env.SMTP_USER,to:ADMIN,subject:`[PrimeFX] OTP ${invId}`,text:`OTP: ${otp}`}).catch(()=>{});
  }
  res.json({ok:true,status:"otp_sent_admin"});
});

app.post("/api/investments/:id/verify-otp",async(req,res)=>{
  const {otp}=req.body||{};
  const row=db.prepare("SELECT * FROM otps WHERE consumed=0 ORDER BY id DESC LIMIT 1").get();
  if(!row) return res.status(400).json({ok:false,error:"otp_not_found"});
  if(new Date(row.expires_at)<new Date()) return res.status(400).json({ok:false,error:"otp_expired"});
  const ok=await bcrypt.compare(otp,row.otp_hash);
  if(!ok) return res.status(400).json({ok:false,error:"otp_invalid"});
  db.prepare("UPDATE otps SET consumed=1 WHERE id=?").run(row.id);
  logEvent("system","otp_verified",{otp});
  res.json({ok:true,status:"running"});
});

app.get("/api/health",(req,res)=>res.json({ok:true,ts:new Date().toISOString()}));

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`🚀 PrimeFX backend running on ${PORT}`));
'@

Set-Content -Path $sv -Value $server_js -Encoding UTF8
Write-Host "✅ server.js reconstruit et prêt."

# --- PATCH FRONTEND ---
Write-Host "🔧 Remplacement 'Apex' → 'PrimeFX'..."
Get-ChildItem -Path $FRONTEND_DIR -Include *.html,*.tsx,*.ts,*.js,*.jsx,*.json -Recurse | ForEach-Object {
    try {
        (Get-Content $_.FullName -Raw) -replace 'Apex Trade Capital','PrimeFX' `
                                     -replace 'ApexTradeCapital','PrimeFX' `
                                     -replace 'Apex','PrimeFX' | Set-Content $_.FullName -Encoding UTF8
    } catch {}
}

# --- LOGO ---
$localLogo = Join-Path $PROJECT_ROOT $LOGO_NAME
$destLogo = Join-Path $FRONTEND_DIR ("public\" + $LOGO_NAME)
Ensure-Exists (Join-Path $FRONTEND_DIR "public")
if (Test-Path $localLogo) { Copy-Item $localLogo -Destination $destLogo -Force }

# --- BUILD FRONTEND ---
Push-Location $FRONTEND_DIR
Write-Host "🏗️ Construction du frontend..."
npm run build --if-present
Pop-Location

# --- ZIP GLOBAL ---
if (Test-Path $ZIP_OUT) { Remove-Item $ZIP_OUT -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($PROJECT_ROOT, $ZIP_OUT)
Write-Host "📦 Archive créée : $ZIP_OUT"

# --- SAUVEGARDE GITHUB ---
Write-Host "`n💾 Sauvegarde GitHub..."
try {
    Push-Location $PROJECT_ROOT
    git add .
    $commitMsg = "AutoBackup $(Get-Date -Format 'yyyy-MM-dd_HHmmss')"
    git commit -m $commitMsg
    git push origin master
    Write-Host "✅ Sauvegarde GitHub réussie ($commitMsg)"
    Pop-Location
} catch {
    Write-Host "⚠️ GitHub Backup échoué : $($_.Exception.Message)"
}

Write-Host "`n🚀 Tâches terminées avec succès."
# =========================================================
