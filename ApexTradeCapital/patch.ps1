# === APEX TRADE CAPITAL PATCH AUTOMATIQUE ===

Write-Host "🚀 Initialisation du patch backend..."

$backendPath = "backend"
$serverFile = "$backendPath\server.js"

# Vérifie si le backend existe
if (!(Test-Path $serverFile)) {
    Write-Host "❌ Fichier server.js introuvable. Vérifie ton dossier backend."
    exit
}

# --- Ajout des dépendances ---
npm install node-fetch better-sqlite3 ws --save

# --- Injection du code logEvent + DB ---
$patch = @'
import fetch from "node-fetch";
import Database from "better-sqlite3";

const db = new Database("data/apex.db");
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    email TEXT,
    created_at TEXT
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    offer TEXT,
    amount INTEGER,
    status TEXT,
    created_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT,
    actor TEXT,
    type TEXT,
    payload TEXT
  );
`).run();

const clients = new Set();
function broadcast(msg) {
  const data = JSON.stringify({ topic: "events", ...msg });
  for (const ws of clients) { try { ws.send(data); } catch {} }
}

function logEvent(actor, type, payload = {}) {
  const ts = new Date().toISOString();
  db.prepare("INSERT INTO events(ts, actor, type, payload) VALUES (?, ?, ?, ?)")
    .run(ts, actor, type, JSON.stringify(payload));
  broadcast({ ts, actor, type, payload });
}

export { db, logEvent, clients, broadcast };
'@

Add-Content -Path $serverFile -Value $patch

Write-Host "✅ Patch ajouté avec succès !"
