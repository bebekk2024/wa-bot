const express = require('express');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const P = require('pino');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 KEEP ALIVE HEROKU
app.get('/', (req, res) => {
  res.send('WhatsApp Bot Running 🚀');
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});

let retryCount = 0;

async function startBot() {
  console.log('🚀 BOT STARTING...');

  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' }),
    printQRInTerminal: false // kita handle manual
  });

  sock.ev.on('creds.update', saveCreds);

  // 🔥 CONNECTION HANDLER (QR FIX)
  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    // 📲 QR WAJIB MUNCUL DI LOGS
    if (qr) {
      console.log('\n====================');
      console.log('📲 SCAN QR WHATSAPP:');
      console.log(qr);
      console.log('====================\n');
    }

    if (connection === 'open') {
      console.log('✅ WHATSAPP CONNECTED');
      retryCount = 0;
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      console.log('❌ CONNECTION CLOSED:', statusCode);

      // 🚫 STOP kalau logout permanen
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('⚠️ LOGOUT DETECTED - DELETE SESSION & RESCAN');
        return;
      }

      // 🔥 ANTI SPAM RECONNECT (IMPORTANT UNTUK 405 FIX)
      retryCount++;

      if (retryCount > 5) {
        console.log('🚫 TOO MANY RECONNECTS - STOPPING TO PREVENT BLOCK');
        return;
      }

      console.log(`♻️ RECONNECTING... (${retryCount}/5)`);

      setTimeout(() => {
        startBot();
      }, 8000); // delay aman
    }
  });

  // 💬 AUTO REPLY SIMPLE
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      '';

    const from = msg.key.remoteJid;
    const t = text.toLowerCase();

    let reply = 'Maaf aku tidak mengerti 😅';

    if (t.includes('halo')) reply = 'Halo juga 😊';
    else if (t.includes('nama')) reply = 'Aku bot WhatsApp 🤖';
    else if (t.includes('jam')) reply = 'Sekarang jam ' + new Date().toLocaleTimeString();

    await sock.sendMessage(from, { text: reply });
  });
}

// 🔥 START BOT
startBot();

// 🔥 ANTI CRASH HEROKU
process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);
