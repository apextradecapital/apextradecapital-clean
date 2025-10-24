import fs from "fs";
import path from "path";

// assure que le dossier data existe
const dataDir = path.resolve("data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log("✅ dossier 'data' créé automatiquement");
}
// ================== APEX TRADE CAPITAL - BACKEND LOCAL SECURISE ==================

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const helmet = require("helmet");
const Database = require("better-sqlite3");
const { WebSocketServer } = require("ws");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(helmet());

// ---- Base de données SQLite locale ----
const db = new Database(process.env.DB_FILE || '');

// ---- Création des tables ----
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  wallet TEXT,
  createdAt INTEGER
);
CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  userId TEXT,
  code TEXT,
  expiresAt INTEGER,
  used INTEGER DEFAULT 0,
  createdAt INTEGER
);
CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  userId TEXT,
  path TEXT,
  size INTEGER,
  uploadedAt INTEGER
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  toUserId TEXT,
  body TEXT,
  createdAt INTEGER
);
`);

const upload = multer({ dest: process.env.UPLOAD_DIR || '' });

// ---- Route test ----
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "Backend actif", version: "1.0" });
});

// ---- Génération OTP ----
app.post("/api/otp/generate", (req, res) => {
  const { userId = "guest" } = req.body;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  db.prepare(
    "INSERT INTO otps (id,userId,code,expiresAt,used,createdAt) VALUES (?,?,?,?,?,?)"
  ).run("otp_" + Date.now(), userId, code, Date.now() + 600000, 0, Date.now());
  res.json({ ok: true, code });
});

// ---- Vérification OTP ----
app.post("/api/otp/verify", (req, res) => {
  const { userId, code } = req.body;
  const row = db
    .prepare("SELECT * FROM otps WHERE userId=? AND code=? AND used=0")
    .get(userId, code);
  if (!row) return res.status(404).json({ error: "invalid" });
  if (Date.now() > row.expiresAt)
    return res.status(410).json({ error: "expired" });
  db.prepare("UPDATE otps SET used=1 WHERE id=?").run(row.id);
  res.json({ ok: true });
});

// ---- Upload de fichiers ----
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "missing_file" });
  db.prepare(
    "INSERT INTO uploads (id,userId,path,size,uploadedAt) VALUES (?,?,?,?,?)"
  ).run(
    "upl_" + Date.now(),
    req.body.userId || "guest",
    req.file.path,
    req.file.size,
    Date.now()
  );
  res.json({ ok: true });
});

// ---- Démarrage serveur ----
const server = app.listen(PORT, () =>
  console.log(`✅ Backend sécurisé lancé sur http://localhost:${PORT}`)
);

// ---- WebSocket ----
const wss = new WebSocketServer({ server });
wss.on("connection", (ws) => ws.send("connecté au backend local"));


