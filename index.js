const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  // 🔥 INI YANG BENAR UNTUK QR
  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log('==============================');
      console.log('SCAN QR INI DI WHATSAPP 👇');
      console.log(qr);
      console.log('==============================');
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp CONNECTED');
    }

    if (connection === 'close') {
      console.log('❌ Connection closed');
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
