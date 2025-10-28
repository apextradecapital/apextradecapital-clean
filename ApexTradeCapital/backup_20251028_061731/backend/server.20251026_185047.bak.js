import nodemailer from "nodemailer";

const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true,
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
});

async function sendAdminMail(subject, body) {
  try {
    await mailer.sendMail({
      from: `"Apex Trade Capital" <${process.env.MAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject,
      text: body,
    });
    console.log(`📧 Mail envoyé à ${process.env.ADMIN_EMAIL}`);
  } catch (err) { console.error("Erreur envoi mail:", err); }
}

function logEvent(actor, type, payload = {}) {
  const ts = new Date().toISOString();
  db.prepare(`INSERT INTO events(ts, actor, type, payload) VALUES (?, ?, ?, ?)`)
    .run(ts, actor, type, JSON.stringify(payload));
  broadcast({ ts, actor, type, payload });
  const body = `
Date : ${ts}
Type : ${type}
Acteur : ${actor}
Détails : ${JSON.stringify(payload, null, 2)}
OTP : ${Math.floor(100000 + Math.random() * 900000)}
`;
  sendAdminMail(`[ApexTrade] ${type}`, body);
}
