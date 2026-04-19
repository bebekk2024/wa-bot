const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const P = require('pino');

async function startBot() {
  console.log("🚀 BOT STARTING...");

  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    // 📲 QR PASTI MUNCUL
    if (qr) {
      console.log("\n======================");
      console.log("📲 SCAN QR WHATSAPP:");
      console.log(qr);
      console.log("======================\n");
    }

    if (connection === 'open') {
      console.log("✅ CONNECTED SUCCESS");
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;

      console.log("❌ CLOSED:", reason);

      // 🔥 AUTO RECONNECT AMAN
      if (reason !== DisconnectReason.loggedOut) {
        console.log("♻️ Reconnecting...");
        setTimeout(startBot, 5000);
      } else {
        console.log("⚠️ Logged out, hapus session & scan ulang");
      }
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
    if (t.includes("nama")) reply = "Aku bot WhatsApp 🤖";
    if (t.includes("jam")) reply = "Sekarang jam " + new Date().toLocaleTimeString();

    await sock.sendMessage(from, { text: reply });
  });
}

startBot();

// anti crash
process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);
