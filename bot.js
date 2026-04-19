require("dotenv").config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")

const prefix = process.env.BOT_PREFIX || "."
const botName = process.env.BOT_NAME || "AMASHIA MD BOT V.2"
const number = process.env.PAIRING_NUMBER

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(
    process.env.SESSIONS_DIR || "sessions"
  )

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" })
  })

  // 🔑 PAIRING CODE
  if (!sock.authState.creds.registered) {
    const code = await sock.requestPairingCode(number)
    console.log("🔑 Pairing Code:", code)
  }

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) startBot()
    }

    if (connection === "open") {
      console.log("✅ Connected:", botName)
    }
  })

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(" ")
    const command = args.shift().toLowerCase()

    // 📋 MENU
    if (command === "menu") {
      await sock.sendMessage(from, {
        text: `🤖 ${botName}

Prefix: ${prefix}

.menu
.play
.tiktok
.lyrics
.trad`
      })
    }

    // 🧠 SIMPLE PLAY (FIXED)
    if (command === "play") {
      const query = args.join(" ")
      await sock.sendMessage(from, {
        text: `🎧 Searching: ${query}`
      })
    }

  })
}

startBot()