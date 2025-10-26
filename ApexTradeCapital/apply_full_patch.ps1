# =============================================
# ✅ ApexTradeCapital - Patch Mail + Log + OTP
# =============================================

$proj = Get-Location
Write-Host "📦 Patch en cours dans : $proj" -ForegroundColor Cyan

# Aller dans le backend
Set-Location "$proj\backend"

# Installer les dépendances nécessaires
npm i node-fetch@2 nodemailer better-sqlite3 ws express cors helmet dotenv --no-audit --no-fund

# Cibler le fichier server.js
$server = "$proj\backend\server.js"
if (!(Test-Path $server)) {
  Write-Host "❌ Erreur : fichier introuvable ($server)" -ForegroundColor Red
  exit
}

# Lire le contenu
$content = Get-Content $server -Raw

# Si le patch n’est pas encore injecté
if ($content -notmatch "CREATE TABLE IF NOT EXISTS events") {

$insert = @"
//////////////////////////////////////////////////////////////////
// === AUTO PATCH : Gestion DB, Logs, Mails, OTP & WebSocket ===
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import Database from 'better-sqlite3';
import { WebSocketServer } from 'ws';

const db = new Database('data/apextrade.db');

// --- Création automatique des tables ---
db.prepare(\`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  email TEXT,
  created_at TEXT
);\`).run();

db.prepare(\`
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  offer TEXT,
  amount INTEGER,
  status TEXT,
  created_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);\`).run();

db.prepare(\`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT,
  actor TEXT,
  type TEXT,
  payload TEXT
);\`).run();

// --- WebSocket live admin ---
const clients = new Set();
const wss = new WebSocketServer({ port: 8081 });
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});
function broadcast(msg) {
  const data = JSON.stringify({ topic: 'events', ...msg });
  for (const ws of clients) { try { ws.send(data); } catch {} }
}

// --- Fonction principale de log ---
function logEvent(actor, type, payload = {}) {
  const ts = new Date().toISOString();
  db.prepare('INSERT INTO events(ts, actor, type, payload) VALUES (?, ?, ?, ?)')
    .run(ts, actor, type, JSON.stringify(payload));
  broadcast({ ts, actor, type, payload });

  // --- Génération OTP aléatoire pour logs internes ---
  const otp = Math.floor(100000 + Math.random() * 900000);

  // --- Envoi email admin ---
  if (process.env.ADMIN_MAIL && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      const message = \`🧩 [ApexTradeCapital]
Date : \${ts}
Type : \${type}
Acteur : \${actor}
Détails : \${JSON.stringify(payload, null, 2)}
OTP : \${otp}\`;
      transporter.sendMail({
        from: \`Apex Trade Capital <\${process.env.SMTP_USER}>\`,
        to: process.env.ADMIN_MAIL,
        subject: \`[Apex] \${type}\`,
        text: message
      }).catch(() => {});
    } catch (e) { console.error('Erreur mail:', e.message); }
  }
}

// --- Routes Backend Exemple ---
app.post('/api/register', (req, res) => {
  const { name, phone, email } = req.body;
  const id = 'usr_' + Date.now();
  db.prepare('INSERT INTO users(id, name, phone, email, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, phone, email, new Date().toISOString());
  logEvent('user:\${id}', 'user_registered', { id, name, phone });
  res.json({ ok: true, userId: id });
});

app.post('/api/investments', (req, res) => {
  const { userId, offer, amount } = req.body;
  const id = 'inv_' + Date.now();
  db.prepare('INSERT INTO investments(id, user_id, offer, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, offer, amount, 'pending', new Date().toISOString());
  logEvent('user: + userId, 'invest_created', { investmentId: id, offer, amount });
  res.json({ ok: true, investmentId: id, status: 'pending' });
});

app.post('/api/investments/:id/confirm', (req, res) => {
  const invId = req.params.id;
  db.prepare('UPDATE investments SET status="confirmed" WHERE id=?').run(invId);
  logEvent('system', 'invest_confirmed', { investmentId: invId });
  res.json({ ok: true });
});
//////////////////////////////////////////////////////////////////
"@

Add-Content -Path $server -Value $insert
Write-Host "✅ Patch ajouté dans server.js" -ForegroundColor Green

} else {
Write-Host "ℹ️  Patch déjà présent, aucune modification appliquée." -ForegroundColor Yellow
}
