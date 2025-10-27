import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import Database from "better-sqlite3";
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

// === ✅ Dossier DATA compatible Render ===
const dataDir = process.env.DATA_DIR || path.resolve("./data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, "apextrade.db");
const db = new Database(dbPath);
console.log("📁 Base de données :", dbPath);

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
  rate REAL,
  fee_percent REAL,
  fee_fixed REAL,
  created_at TEXT,
  updated_at TEXT
);`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS otps(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investment_id TEXT,
  user_id TEXT,
  otp_hash TEXT,
  expires_at TEXT,
  consumed INTEGER DEFAULT 0
);`).run();

// === MAIL ===
const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

// === Fonctions utilitaires ===
function nowISO() { return new Date().toISOString(); }
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function computeProgress(inv) {
  const principal = Number(inv.amount || 0);
  if (!inv.start_at || !inv.duration_days) return { progress: 0, net: principal };
  const start = new Date(inv.start_at).getTime();
  const elapsed = Date.now() - start;
  const total = inv.duration_days * 24 * 3600 * 1000;
  const progress = clamp(Math.round((elapsed / total) * 100), 0, 100);
  const rate = inv.rate || 0.4;
  const accrued = principal * rate * (progress / 100);
  const fee = (inv.fee_percent || 0) / 100 * principal + (inv.fee_fixed || 0);
  const net = principal + accrued - fee;
  return { progress, net };
}

// === ROUTES ===

// --- Santé ---
app.get("/api/health", (req, res) => {
  res.json({ ok: true, ts: nowISO() });
});

// --- Inscription ---
app.post("/api/register", (req, res) => {
  const { firstName, lastName, countryCode, dial, phone } = req.body;
  if (!firstName || !lastName || !phone)
    return res.status(400).json({ ok: false, error: "missing_fields" });

  const id = "usr_" + crypto.randomUUID();
  db.prepare(
    "INSERT INTO users(id,first_name,last_name,country_code,dial,phone,created_at) VALUES(?,?,?,?,?,?,?)"
  ).run(id, firstName, lastName, countryCode, dial, phone, nowISO());
  console.log("👤 Nouvel utilisateur:", firstName, lastName);

  res.json({ ok: true, userId: id });
});

// --- Création investissement ---
app.post("/api/invest", (req, res) => {
  const { userId, offer, amount, durationDays, rate } = req.body;
  if (!userId || !offer || !amount)
    return res.status(400).json({ ok: false, error: "missing_fields" });

  const id = "inv_" + crypto.randomUUID();
  const now = nowISO();
  db.prepare(
    "INSERT INTO investments(id,user_id,offer,amount,status,start_at,duration_days,rate,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)"
  ).run(id, userId, offer, Number(amount), "pending", null, durationDays || 4, rate || 0.4, now, now);
  res.json({ ok: true, investmentId: id, status: "pending" });
});

// --- Confirmation investissement + génération OTP ---
app.post("/api/invest/:id/confirm", async (req, res) => {
  const invId = req.params.id;
  const inv = db.prepare("SELECT * FROM investments WHERE id=?").get(invId);
  if (!inv) return res.status(404).json({ ok: false, error: "not_found" });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);
  const exp = new Date(Date.now() + 15 * 60000).toISOString();

  db.prepare("INSERT INTO otps(investment_id,user_id,otp_hash,expires_at,consumed) VALUES(?,?,?,?,0)")
    .run(invId, inv.user_id, otpHash, exp);

  db.prepare("UPDATE investments SET status='confirmed', updated_at=? WHERE id=?")
    .run(nowISO(), invId);

  // Envoi du mail admin
  const body = [
    "CONFIRMATION INVESTISSEMENT",
    `Date: ${nowISO()}`,
    `InvestmentID: ${invId}`,
    `UserID: ${inv.user_id}`,
    `Offre: ${inv.offer}`,
    `Montant: ${inv.amount} HTG`,
    `OTP: ${otp}`,
    "Expire dans 15 minutes"
  ].join("\n");

  try {
    await mailer.sendMail({
      from: `"Apex Trade Capital" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `[Apex OTP] ${invId}`,
      text: body
    });
    console.log("📧 OTP envoyé à l'administrateur:", otp);
  } catch (err) {
    console.error("Erreur mail:", err);
  }

  res.json({ ok: true, status: "otp_sent_admin" });
});

// --- Vérification OTP ---
app.post("/api/invest/:id/verify", async (req, res) => {
  const invId = req.params.id;
  const { otp } = req.body;
  const record = db.prepare("SELECT * FROM otps WHERE investment_id=? AND consumed=0").get(invId);
  if (!record) return res.status(400).json({ ok: false, error: "otp_not_found" });

  const valid = await bcrypt.compare(otp, record.otp_hash);
  if (!valid) return res.status(400).json({ ok: false, error: "otp_invalid" });

  db.prepare("UPDATE otps SET consumed=1 WHERE id=?").run(record.id);
  db.prepare("UPDATE investments SET status='running', start_at=?, updated_at=? WHERE id=?")
    .run(nowISO(), nowISO(), invId);

  res.json({ ok: true, status: "running" });
});

// --- Suivi solde / progression ---
app.get("/api/invest/:id/balance", (req, res) => {
  const inv = db.prepare("SELECT * FROM investments WHERE id=?").get(req.params.id);
  if (!inv) return res.status(404).json({ ok: false, error: "not_found" });
  const { progress, net } = computeProgress(inv);
  res.json({ ok: true, progress, net });
});

// --- Pause / Reprise / Annulation ---
app.post("/api/admin/:action", (req, res) => {
  const { investmentId } = req.body;
  const action = req.params.action;
  const valid = ["pause", "resume", "cancel"];
  if (!valid.includes(action)) return res.status(400).json({ ok: false, error: "invalid_action" });
  db.prepare(`UPDATE investments SET status=?, updated_at=? WHERE id=?`)
    .run(action, nowISO(), investmentId);
  res.json({ ok: true, status: action });
});

// --- WhatsApp ---
app.post("/api/whatsapp", (req, res) => {
  const { context } = req.body || {};
  const phone = (process.env.WHATSAPP_NUMBER || "+16265333367").replace(/\D/g, "");
  const texts = {
    help: "Bonjour, j’ai besoin d’aide pour mon investissement.",
    invest: "Bonjour, je souhaite réaliser un investissement.",
    withdraw: "Bonjour, je souhaite retirer mes bénéfices."
  };
  const msg = texts[context || "help"];
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  res.json({ ok: true, url });
});

// --- Santé API ---
app.get("/", (req, res) => {
  res.send("🌐 Apex Trade Capital Backend opérationnel !");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend lancé sur le port ${PORT}`));
