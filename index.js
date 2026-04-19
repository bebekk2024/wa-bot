const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys');

const P = require('pino');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  // 🔥 QR + CONNECTION HANDLER
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('SCAN QR INI 👇');
      console.log(qr);
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;

      console.log('❌ Connection closed, reason:', reason);

      // 🔥 AUTO RECONNECT
      if (reason !== DisconnectReason.loggedOut) {
        console.log('♻️ Reconnecting...');
        startBot();
      } else {
        console.log('⚠️ Logged out, delete session dan scan ulang');
      }
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp CONNECTED');
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

// 🔥 ANTI CRASH NODE
process.on('uncaughtException', console.log);
process.on('unhandledRejection', console.log);
