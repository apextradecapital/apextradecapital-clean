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

// === Dossier data ===
const dataDir = path.resolve("data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "apextrade.db"));

// === Tables ===
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
  updated_at TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS otps(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investment_id TEXT,
  user_id TEXT,
  otp_hash TEXT,
  expires_at TEXT,
  consumed INTEGER DEFAULT 0
);`).run();

// === Correction : création de la table events ===
db.prepare(`CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,
  message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);`).run();

// === Fonction utilitaire pour journaliser ===
function logEvent(type, message) {
  db.prepare(`INSERT INTO events(type, message) VALUES (?, ?)`).run(type, message);
}

// === Mailer ===
const ADMIN = process.env.ADMIN_EMAIL;
const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: true,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

function sendAdminMail(subject, text) {
  if (!ADMIN) return;
  mailer.sendMail({
    from: `"Apex Trade Capital" <${process.env.MAIL_USER}>`,
    to: ADMIN,
    subject,
    text
  }).catch(console.error);
}

// === Routes principales ===

app.post("/api/register", (req, res) => {
  const { firstName, lastName, countryCode, dial, phone } = req.body;
  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ ok: false, error: "missing_fields" });
  }
  const id = "usr_" + crypto.randomUUID();
  db.prepare(`INSERT INTO users(id, first_name, last_name, country_code, dial, phone, created_at)
              VALUES (?,?,?,?,?,?,datetime('now'))`).run(id, firstName, lastName, countryCode, dial, phone);
  logEvent("register", `Utilisateur ${firstName} ${lastName} enregistré`);
  sendAdminMail("Nouvel utilisateur", `Nom: ${firstName} ${lastName}\nTéléphone: ${dial}${phone}`);
  res.json({ ok: true, userId: id });
});

app.post("/api/invest", (req, res) => {
  const { userId, offer, amount } = req.body;
  if (!userId || !offer || !amount) return res.status(400).json({ ok: false, error: "missing_fields" });
  const invId = "inv_" + crypto.randomUUID();
  db.prepare(`INSERT INTO investments(id, user_id, offer, amount, status, created_at)
              VALUES (?,?,?,?, 'pending', datetime('now'))`)
    .run(invId, userId, offer, amount);
  logEvent("invest", `Nouvel investissement ${invId} par ${userId}`);
  sendAdminMail("Nouvel investissement", `User: ${userId}\nMontant: ${amount}\nOffre: ${offer}`);
  res.json({ ok: true, investmentId: invId });
});

app.post("/api/invest/:id/confirm", async (req, res) => {
  const invId = req.params.id;
  const inv = db.prepare("SELECT * FROM investments WHERE id=?").get(invId);
  if (!inv) return res.status(404).json({ ok: false });
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);
  const exp = new Date(Date.now() + 15 * 60000).toISOString();
  db.prepare(`INSERT INTO otps(investment_id,user_id,otp_hash,expires_at) VALUES (?,?,?,?)`)
    .run(invId, inv.user_id, otpHash, exp);
  logEvent("otp", `OTP généré pour ${invId}`);
  sendAdminMail("OTP Admin", `OTP pour ${invId} : ${otp}`);
  res.json({ ok: true, msg: "OTP envoyé à l'admin" });
});

// === Health Check ===
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// === Événements ===
app.get("/api/events", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM events ORDER BY rowid DESC LIMIT 100").all();
    res.json({ ok: true, events: rows });
  } catch (err) {
    console.error("Erreur /api/events:", err);
    res.status(500).json({ ok: false, error: "server_error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend opérationnel sur le port ${PORT}`));
