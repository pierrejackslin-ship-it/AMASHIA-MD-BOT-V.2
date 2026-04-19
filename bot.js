require("dotenv").config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")
const web = require("./server") // 🌐 DASHBOARD LINK

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

    console.log("🔑 PAIRING CODE:", code)

    // 👉 SEND TO CHROME DASHBOARD
    web.setCode(code)
  }

  sock.ev.on("creds.update", saveCreds)

  // 🔄 CONNECTION STATUS
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ Connected:", botName)
      web.setStatus("ONLINE 🟢")
    }

    if (connection === "close") {
      web.setStatus("OFFLINE 🔴")

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) startBot()
    }
  })

  // 👋 WELCOME + COMMANDS
  const welcomedUsers = new Set()

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    // 👋 WELCOME
    if (!welcomedUsers.has(from)) {
      welcomedUsers.add(from)

      await sock.sendMessage(from, {
        text: `👋 HELLO!

🤖 I am *${botName}*

📌 Type *.menu* to start`
      })
    }

    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(" ")
    const command = args.shift().toLowerCase()

    // 📋 MENU
    if (command === "menu") {
      await sock.sendMessage(from, {
        text: `🤖 *${botName}*

📋 MENU:
.play
.tiktok
.lyrics
.trad`
      })
    }

    // 🎧 PLAY
    if (command === "play") {
      const query = args.join(" ")
      await sock.sendMessage(from, {
        text: `🎧 Searching: ${query}`
      })
    }
  })
}

startBot()