require("dotenv").config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys")

const P = require("pino")

// ================= CONFIG =================
const prefix = process.env.BOT_PREFIX || "."
const botName = process.env.BOT_NAME || "AMASHIA MD BOT V.2"
const number = process.env.PAIRING_NUMBER

// ================= START BOT =================
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
  }

  sock.ev.on("creds.update", saveCreds)

  // 🔄 CONNECTION HANDLER
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ Connected:", botName)
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

      if (shouldReconnect) startBot()
    }
  })

  // 👋 WELCOME SYSTEM
  const welcomedUsers = new Set()

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0]
    if (!msg.message) return

    const from = msg.key.remoteJid

    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ""

    // ================= WELCOME =================
    if (!welcomedUsers.has(from)) {
      welcomedUsers.add(from)

      await sock.sendMessage(from, {
        text: `👋 HELLO!

🤖 I am *${AMASHIA-MD-BOT-V2}*

📌 I am here to help you with:

🎧 Download music
🎵 Download TikTok videos
🌍 Translate text
📝 Get song lyrics
⚡ Auto bot features

📋 Type *.menu* to see all commands

💡 Enjoy using *${AMASHIA-MD-BOT-V2}* 🚀`
      })
    }

    // ================= COMMAND CHECK =================
    if (!body.startsWith(prefix)) return

    const args = body.slice(prefix.length).trim().split(" ")
    const command = args.shift().toLowerCase()

    // 📋 MENU
    if (command === "menu") {
      await sock.sendMessage(from, {
        text: `🤖 *${botName}*

📋 COMMAND MENU:

🎧 MEDIA
.play <name> → Search music
.tiktok <link> → Download video

📝 TEXT
.lyrics <song> → Get lyrics
.trad <lang> <text> → Translate text

⚡ SYSTEM
.menu → Show this menu

💡 Powered by AMASHIA MD SYSTEM 🚀`
      })
    }

    // 🎧 PLAY
    if (command === "play") {
      const query = args.join(" ")
      await sock.sendMessage(from, {
        text: `🎧 Searching: ${query}`
      })
    }

    // 🎵 TIKTOK
    if (command === "tiktok") {
      const link = args[0]
      await sock.sendMessage(from, {
        text: `📥 Processing TikTok link:\n${link}`
      })
    }

    // 🌍 TRANSLATE
    if (command === "trad") {
      const lang = args[0]
      const text = args.slice(1).join(" ")

      await sock.sendMessage(from, {
        text: `🌍 Translation Request:
Language: ${lang}
Text: ${text}`
      })
    }

    // 📝 LYRICS (placeholder)
    if (command === "lyrics") {
      const song = args.join(" ")

      await sock.sendMessage(from, {
        text: `📝 Searching lyrics for:
${song}`
      })
    }
  })
}

// ================= RUN =================
startBot()