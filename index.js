const express = require('express');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const P = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

// KEEP ALIVE HEROKU
app.get('/', (req, res) => {
  res.send('Bot WA aktif 🚀');
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

let reconnectAttempt = 0;

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    connectTimeoutMs: 60000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr) {
      console.log('SCAN QR INI 👇');
      console.log(qr);
    }

    if (connection === 'open') {
      console.log('✅ CONNECTED SUCCESS');
      reconnectAttempt = 0;
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;

      console.log('❌ Closed reason:', reason);

      // 🚫 STOP kalau logout permanen
      if (reason === DisconnectReason.loggedOut) {
        console.log('⚠️ Logged out. Hapus session & scan ulang');
        return;
      }

      // 🔥 ANTI SPAM RECONNECT (INI PENTING UNTUK FIX 405)
      reconnectAttempt++;

      if (reconnectAttempt > 3) {
        console.log('🚫 Too many retries. STOP to avoid 405 block.');
        return;
      }

      console.log('♻️ Reconnect delay 10 detik...');
      setTimeout(() => {
        startBot();
      }, 10000);
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
    else if (t.includes("nama")) reply = "Aku bot WhatsApp 🤖";
    else if (t.includes("jam")) reply = "Sekarang jam " + new Date().toLocaleTimeString();

    await sock.sendMessage(from, { text: reply });
  });
}

startBot();

// ANTI CRASH NODE
process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);
