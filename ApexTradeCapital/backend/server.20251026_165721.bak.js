import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import multer from "multer";
import helmet from "helmet";
import Database from "better-sqlite3";
import WebSocket, { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

// --- Création automatique du dossier data ---
const dataDir = path.resolve("data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✅ dossier 'data' créé automatiquement");
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(helmet());

app.get("/", (req, res) => {
  res.send("🚀 Apex Trade Capital Backend opérationnel !");
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
import fetch from "node-fetch";
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
