const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const from = msg.key.remoteJid;

    let reply = "Maaf aku tidak mengerti 😅";

    const t = text.toLowerCase();

    if (t.includes("halo")) reply = "Halo juga 😊";
    if (t.includes("nama")) reply = "Aku bot WhatsApp otomatis 🤖";
    if (t.includes("jam")) reply = "Sekarang jam " + new Date().toLocaleTimeString();

    await sock.sendMessage(from, { text: reply });
  });
}

startBot();
