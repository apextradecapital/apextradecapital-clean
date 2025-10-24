// ==========================================
// 💎 APEX TRADE CAPITAL - LOCAL DEPLOY FINAL
// ==========================================

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

(async () => {
  const root = __dirname;
  const backendDir = path.join(root, "backend");
  const frontendDir = path.join(root, "frontend");
  const frontendPort = 5173;
  const phone = "237678953070";

  function startProc(cmd, args, opts) {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    p.on("exit", code => console.log(`🔚 Processus ${cmd} terminé (${code})`));
    return p;
  }

  console.log("⚙️  Démarrage du backend...");
  if (fs.existsSync(path.join(backendDir, "server.js"))) {
    startProc("node", ["server.js"], { cwd: backendDir });
  } else {
    console.log("❌ Fichier backend introuvable : backend/server.js");
  }

  console.log("🚀  Lancement du frontend...");
  if (fs.existsSync(frontendDir)) {
    startProc("npm", ["run", "dev"], { cwd: frontendDir });
  } else {
    console.log("❌ Dossier frontend introuvable.");
  }

  await new Promise(r => setTimeout(r, 7000));

  console.log("🌐  Création du tunnel public LocalTunnel...");
  try {
    const lt = require("localtunnel");
    const tunnel = await lt({ port: frontendPort });
    console.log(`✅  Lien public : ${tunnel.url}`);

    const link = tunnel.url;
    spawn("powershell", ["-Command", `Set-Clipboard -Value '${link}'`]);
    console.log("📋  Lien copié dans le presse-papier !");
    const wa = `https://wa.me/${phone}?text=${encodeURIComponent(
      "Lien APEX Trade Capital actif : " + link
    )}`;
    spawn("cmd", ["/c", "start", wa]);
    console.log("💬  WhatsApp ouvert avec le lien.");

    tunnel.on("close", () => console.log("🔒 Tunnel fermé."));
  } catch (err) {
    console.error("⚠️  Erreur lors de la création du tunnel :", err.message);
  }
})();
