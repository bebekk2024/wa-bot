const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== KEEP HEROKU ALIVE =====
app.get('/', (req, res) => {
  res.send('WhatsApp Bot is running 🚀');
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

// ===== WHATSAPP BOT =====
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  // handle QR / connection
  sock.ev.on('connection.update', (update) => {
    const { qr } = update;
    if (qr) {
      console.log('SCAN QR INI DI TERMINAL 👇');
      console.log(qr);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const from = msg.key.remoteJid;
    const t = text.toLowerCase();

    let reply = "Maaf aku tidak mengerti 😅";

    if (t.includes("halo")) reply = "Halo juga 😊";
    else if (t.includes("nama")) reply = "Aku bot WhatsApp otomatis 🤖";
    else if (t.includes("jam")) reply = "Sekarang jam " + new Date().toLocaleTimeString();

    await sock.sendMessage(from, { text: reply });
  });

  sock.ev.on('error', console.log);
}

startBot();

// ===== ANTI CRASH =====
process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);
