const express = require('express');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const P = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 KEEP ALIVE SERVER HEROKU
app.get('/', (req, res) => {
  res.send('WhatsApp Bot Active 🚀');
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

  // 🔥 CONNECTION HANDLER (PENTING)
  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      console.log('======================');
      console.log('SCAN QR INI 👇');
      console.log(qr);
      console.log('======================');
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp CONNECTED');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;

      console.log('❌ Connection closed:', reason);

      // 🔥 AUTO RECONNECT
      if (reason !== DisconnectReason.loggedOut) {
        startBot();
      } else {
        console.log('⚠️ Logout, hapus session & scan ulang');
      }
    }
  });

  // 💬 AUTO REPLY
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
    else if (t.includes("nama")) reply = "Aku bot WhatsApp 🤖";
    else if (t.includes("jam")) reply = "Sekarang jam " + new Date().toLocaleTimeString();

    await sock.sendMessage(from, { text: reply });
  });
}

startBot();

// 🔥 ANTI CRASH
process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);
