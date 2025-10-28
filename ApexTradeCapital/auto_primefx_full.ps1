# =========================================================
# AUTO PRIMEFX FULL – backend + frontend + .env + build + zip + git push
# Place ce fichier à la racine (où il y a backend/ et frontend/)
# =========================================================
$ErrorActionPreference = "Stop"

# --- CONST ---
$ROOT        = Get-Location
$BE          = Join-Path $ROOT "backend"
$FE          = Join-Path $ROOT "frontend"
$DATA        = Join-Path $ROOT "data"
$UPLOADS     = Join-Path $ROOT "uploads"
$STAMP       = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR  = Join-Path $ROOT ("backup_" + $STAMP)
$LOGO_NAME   = "logo.png"          # mets logo.png à la racine avant d'exécuter
$ZIP_PATH    = Join-Path $ROOT "primefx_ready.zip"
$STAGING     = Join-Path $ROOT ("_staging_" + $STAMP)
$APPNAME     = "PrimeFX"

function Ensure-Dir($p){ if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null } }
function Has-File($p){ return (Test-Path $p -PathType Leaf) }

# --- PRÉCHECKS ---
if (!(Test-Path $BE)) { throw "backend/ introuvable" }
if (!(Test-Path $FE)) { throw "frontend/ introuvable" }
if (!(Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm non trouvé. Installe Node.js" }

# --- BACKUP FULL ---
Ensure-Dir $BACKUP_DIR
Copy-Item $BE -Destination (Join-Path $BACKUP_DIR "backend") -Recurse -Force
Copy-Item $FE -Destination (Join-Path $BACKUP_DIR "frontend") -Recurse -Force
Write-Host "Backup -> $BACKUP_DIR"

# --- STRUCTURE DATA/UPLOADS ---
Ensure-Dir $DATA
Ensure-Dir $UPLOADS

# --- INSTALL DEPENDANCES BACKEND ---
Push-Location $BE
if (Has-File (Join-Path $BE "package-lock.json")) { npm ci --no-fund --no-audit } else { npm install --no-fund --no-audit }
npm install express cors helmet dotenv better-sqlite3 ws nodemailer bcrypt --no-fund --no-audit
Pop-Location

# --- INSTALL DEPENDANCES FRONTEND ---
Push-Location $FE
if (Has-File (Join-Path $FE "package-lock.json")) { npm ci --no-fund --no-audit } else { npm install --no-fund --no-audit }
Pop-Location

# --- RÉÉCRITURE BACKEND/server.js (stable) ---
$sv      = Join-Path $BE "server.js"
$sv_bak  = Join-Path $BE ("server.js.bak." + $STAMP)
if (Has-File $sv) { Copy-Item $sv $sv_bak -Force; Write-Host "Backup server.js -> $sv_bak" }

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

// --- DATA & DB ---
const DATA_DIR = process.env.DATA_DIR || path.resolve("data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = process.env.DB_FILE || path.join(DATA_DIR, "apextrade.db");
const db = new Database(DB_FILE);

// --- TABLES ---
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

// --- MAIL ---
const ADMIN = process.env.ADMIN_EMAIL;
const mailer = (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: (process.env.SMTP_PORT || "465") === "465",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    })
  : null;

// --- WS ---
const wssPort = Number(process.env.WS_PORT || 3001);
const wss = new WebSocketServer({ port: wssPort });
const wsClients = new Set();
wss.on("connection", ws => { wsClients.add(ws); ws.on("close", () => wsClients.delete(ws)); });
const broadcast = (m) => { const s = JSON.stringify({ topic:"events", ...m }); for (const c of wsClients) { try { c.send(s) } catch {} } };

// --- UTILS ---
const nowISO = () => new Date().toISOString();
const clamp = (n,min,max) => Math.max(min, Math.min(max,n));

// --- LOG ---
function logEvent(actor, type, payload = {}) {
  const ts = nowISO();
  db.prepare("INSERT INTO events(ts,actor,type,payload) VALUES (?,?,?,?)")
    .run(ts, actor, type, JSON.stringify(payload));
  broadcast({ ts, actor, type, payload });
  if (ADMIN && mailer) {
    const body = `Date: ${ts}\nType: ${type}\nActeur: ${actor}\n\n${JSON.stringify(payload,null,2)}`;
    mailer.sendMail({ from: process.env.SMTP_USER, to: ADMIN, subject: `[PrimeFX] ${type}`, text: body }).catch(()=>{});
  }
}

// --- CALCUL PROGRESSION ---
function computeState(inv){
  const principal = Number(inv.amount||0);
  const start = inv.start_at ? new Date(inv.start_at).getTime() : null;
  const durMs = (inv.duration_days||0)*24*3600*1000;
  let progress = 0;
  if (start && durMs>0) progress = clamp(Math.round(((Date.now()-start)/durMs)*100),0,100);
  const rate = Number(inv.rate||0.4);
  const accrued = principal * rate * (progress/100);
  const fees = (principal * Number(inv.fee_percent||0)/100) + Number(inv.fee_fixed||0);
  const net = principal + accrued - fees;
  return { principal, progress, accrued, net };
}

// --- ROUTES ---
app.post("/api/register",(req,res)=>{
  const {firstName,lastName,countryCode,dial,phone}=req.body||{};
  if(!firstName||!lastName||!countryCode||!dial||!phone) return res.status(400).json({ok:false,error:"missing_fields"});
  const id="usr_"+crypto.randomUUID();
  db.prepare("INSERT INTO users(id,first_name,last_name,country_code,dial,phone,created_at) VALUES(?,?,?,?,?,?,?)")
    .run(id,firstName,lastName,countryCode,dial,phone,nowISO());
  logEvent(`user:${id}`,"user_registered",{id,firstName,lastName,countryCode,dial,phone});
  res.json({ok:true,userId:id});
});

app.post("/api/investments",(req,res)=>{
  const {userId,offer,amount,durationDays,rate}=req.body||{};
  if(!userId||!offer||!amount) return res.status(400).json({ok:false,error:"missing_fields"});
  const id="inv_"+crypto.randomUUID();
  const now=nowISO();
  db.prepare("INSERT INTO investments(id,user_id,offer,amount,status,start_at,duration_days,fee_percent,fee_fixed,rate,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(id,userId,offer,Number(amount),"pending",null,Number(durationDays||4),null,null,Number(rate||0.4),now,now);
  logEvent(`user:${userId}`,"invest_created",{investmentId:id,offer,amount:Number(amount)});
  res.json({ok:true,investmentId:id,status:"pending"});
});

app.post("/api/investments/:id/confirm",async(req,res)=>{
  const invId=req.params.id;
  const inv=db.prepare("SELECT * FROM investments WHERE id=?").get(invId);
  if(!inv) return res.status(404).json({ok:false,error:"not_found"});
  const otp=String(Math.floor(100000+Math.random()*900000));
  const otpHash=await bcrypt.hash(otp,10);
  const exp=new Date(Date.now()+ (Number(process.env.OTP_TTL_MIN||15)*60000)).toISOString();
  db.prepare("INSERT INTO otps(investment_id,user_id,otp_hash,expires_at,consumed) VALUES(?,?,?,?,0)")
    .run(invId,inv.user_id,otpHash,exp);
  db.prepare("UPDATE investments SET status='confirmed',updated_at=? WHERE id=?").run(nowISO(),invId);
  logEvent("system","invest_confirmed",{investmentId:invId,userId:inv.user_id,otp_masked:otp.replace(/\d{3}$/,"***")});
  if(ADMIN && mailer){
    mailer.sendMail({from:process.env.SMTP_USER,to:ADMIN,subject:`[PrimeFX] OTP ${invId}`,text:`OTP: ${otp} | Expire: ${exp}`}).catch(()=>{});
  }
  res.json({ok:true,status:"otp_sent_admin"});
});

app.post("/api/investments/:id/verify-otp",async(req,res)=>{
  const {otp}=req.body||{};
  if(!otp) return res.status(400).json({ok:false,error:"missing_otp"});
  const row=db.prepare("SELECT * FROM otps WHERE investment_id=? AND consumed=0 ORDER BY id DESC LIMIT 1").get(req.params.id);
  if(!row) return res.status(400).json({ok:false,error:"otp_not_found"});
  if(new Date(row.expires_at)<new Date()) return res.status(400).json({ok:false,error:"otp_expired"});
  const ok=await bcrypt.compare(otp,row.otp_hash);
  if(!ok) return res.status(400).json({ok:false,error:"otp_invalid"});
  db.prepare("UPDATE otps SET consumed=1 WHERE id=?").run(row.id);
  const now=nowISO();
  db.prepare("UPDATE investments SET status='running',start_at=?,updated_at=? WHERE id=?").run(now,now,req.params.id);
  logEvent("system","invest_started",{investmentId:req.params.id});
  res.json({ok:true,status:"running"});
});

app.post("/api/admin/fees",(req,res)=>{
  const {investmentId,feePercent,feeFixed}=req.body||{};
  if(!investmentId) return res.status(400).json({ok:false,error:"missing_investmentId"});
  db.prepare("UPDATE investments SET fee_percent=?, fee_fixed=?, updated_at=? WHERE id=?")
    .run(feePercent ?? null, feeFixed ?? null, nowISO(), investmentId);
  logEvent("admin","fees_set",{investmentId,feePercent,feeFixed});
  res.json({ok:true});
});

app.post("/api/admin/adjust-balance",(req,res)=>{
  const {investmentId,newPrincipal}=req.body||{};
  if(!investmentId || newPrincipal==null) return res.status(400).json({ok:false,error:"missing_fields"});
  db.prepare("UPDATE investments SET amount=?, updated_at=? WHERE id=?")
    .run(Number(newPrincipal), nowISO(), investmentId);
  logEvent("admin","principal_adjusted",{investmentId,newPrincipal:Number(newPrincipal)});
  res.json({ok:true});
});

app.get("/api/investments/:id/balance",(req,res)=>{
  const inv=db.prepare("SELECT * FROM investments WHERE id=?").get(req.params.id);
  if(!inv) return res.status(404).json({ok:false,error:"not_found"});
  const s=computeState(inv);
  res.json({ok:true,investmentId:inv.id,principal:s.principal,progress:s.progress,accrued:s.accrued,net_balance:s.net,currency:"HTG"});
});

app.post("/api/whatsapp-link",(req,res)=>{
  const { context, userId } = req.body || {};
  const phoneRaw = process.env.WHATSAPP_NUMBER || "+16265333367";
  const dict = { register:"Bonjour, je souhaite créer mon compte.", invest:"Bonjour, je souhaite investir.", withdraw:"Bonjour, je souhaite retirer.", help:"Bonjour, j’ai besoin d’assistance." };
  const msg = dict[context || "help"];
  const url = `https://wa.me/${phoneRaw.replace(/[^0-9]/g,"")}?text=${encodeURIComponent(msg + (userId? " (User:"+userId+")": ""))}`;
  res.json({ ok:true, url });
});

app.get("/api/events",(req,res)=>{
  const rows=db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT 200").all();
  const fmt= r => ({...r, payload: (()=>{
    try{ return JSON.parse(r.payload||"{}") }catch{ return {} }
  })()});
  res.json({ok:true,events: rows.map(fmt)});
});

app.get("/api/health",(req,res)=> res.json({ok:true,ts:new Date().toISOString()}));

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log(`🚀 PrimeFX backend on ${PORT} | WS:${wssPort}`));
'@
Set-Content -Path $sv -Value $server_js -Encoding UTF8
Write-Host "server.js écrit."

# --- .ENV (exemple) à la racine si manquant ---
$ENV_EX = Join-Path $ROOT ".env.example"
$envTxt = @"
APP_NAME=$APPNAME
NODE_ENV=production
PORT=3000
DATA_DIR=./data
DB_FILE=./data/apextrade.db
UPLOAD_DIR=./uploads
WS_PORT=3001
OTP_TTL_MIN=15

# SMTP (renseigne tes vraies valeurs sur Render)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your@email.com
SMTP_PASS=your_app_password

ADMIN_EMAIL=your@email.com
WHATSAPP_NUMBER=+16265333367
USD_RATE=0.012
"@
if (!(Test-Path $ENV_EX)) { $envTxt | Out-File -FilePath $ENV_EX -Encoding UTF8 }

# --- PATCH FRONTEND: Apex -> PrimeFX + logo ---
Write-Host "Patch frontend…"
Get-ChildItem -Path $FE -Include *.html,*.tsx,*.ts,*.js,*.jsx,*.json -Recurse | ForEach-Object {
  try {
    (Get-Content $_.FullName -Raw) -replace 'Apex Trade Capital','PrimeFX' `
                                 -replace 'ApexTradeCapital','PrimeFX' `
                                 -replace '\bApex\b','PrimeFX' | Set-Content $_.FullName -Encoding UTF8
  } catch {}
}

# logo
$logoSrc = Join-Path $ROOT $LOGO_NAME
$logoDst = Join-Path $FE ("public\" + $LOGO_NAME)
Ensure-Dir (Join-Path $FE "public")
if (Has-File $logoSrc) { Copy-Item $logoSrc $logoDst -Force }

# --- BUILD FRONTEND ---
Push-Location $FE
npm run build --if-present
Pop-Location

# --- ZIP (sans node_modules) ---
if (Test-Path $ZIP_PATH) { Remove-Item $ZIP_PATH -Force }
Ensure-Dir $STAGING
Copy-Item $BE -Destination (Join-Path $STAGING "backend") -Recurse -Force
Copy-Item $FE -Destination (Join-Path $STAGING "frontend") -Recurse -Force
Copy-Item $ENV_EX -Destination (Join-Path $STAGING ".env.example") -Force
# suppr node_modules dans staging
Get-ChildItem -Path $STAGING -Recurse -Directory -Filter "node_modules" | ForEach-Object { Remove-Item $_.FullName -Recurse -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($STAGING, $ZIP_PATH)
Remove-Item $STAGING -Recurse -Force
Write-Host "ZIP -> $ZIP_PATH"

# --- GIT PUSH (si repo configuré) ---
try {
  Push-Location $ROOT
  git rev-parse --is-inside-work-tree > $null 2>&1
  if ($LASTEXITCODE -eq 0) {
    git add .
    $msg = "AutoBackup $STAMP"
    git commit -m $msg 2>$null | Out-Null
    git push origin master
    Write-Host "Git push OK ($msg)"
  } else {
    Write-Host "Git non initialisé. Skip."
  }
  Pop-Location
} catch { Write-Host "Git push ignoré: $($_.Exception.Message)" }

Write-Host "`nTerminé."
# =========================================================
