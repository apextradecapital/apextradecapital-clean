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
