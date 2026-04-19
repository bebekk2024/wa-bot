const {
  default: makeWASocket,
  useMultiFileAuthState
} = require('@whiskeysockets/baileys');

const P = require('pino');

async function startBot() {
  console.log("🚀 BOT STARTING...");

  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'debug' }) // 🔥 penting biar tidak silent
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    console.log("📡 UPDATE:", update);

    if (update.qr) {
      console.log("========================");
      console.log("📲 SCAN QR INI:");
      console.log(update.qr);
      console.log("========================");
    }

    if (update.connection === 'open') {
      console.log("✅ CONNECTED SUCCESS");
    }

    if (update.connection === 'close') {
      console.log("❌ CLOSED");
    }
  });
}

startBot();

process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);
