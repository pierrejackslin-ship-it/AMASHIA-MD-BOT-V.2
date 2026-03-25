const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Configure logger
const logger = pino({ level: "silent" });

// Bot configuration
const config = {
  prefix: process.env.BOT_PREFIX || ".",
  ownerNumber: process.env.OWNER_NUMBER || "50931234567",
  botName: process.env.BOT_NAME || "AMASHIA MD BOT V.2",
  allowGroupOnly: false,
  features: {
    alwaysOnline: true,
    fakeTyping: true,
    fakeRecording: true,
    autoStatusSeen: true,
    autoStatusLike: true,
    autoStatusReply: true,
    autoReact: true,
    antiCall: true,
    mediaDownload: true,
    smartAI: true,
    modeChange: true
  }
};

// Create sessions directory if it doesn't exist
const sessionsDir = path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Bot class
class AmashiaBot {
  constructor() {
    this.sock = null;
    this.isConnected = false;
  }

  // Initialize bot
  async init() {
    console.log("🤖 Starting AMASHIA MD BOT V.2...");
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionsDir);
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: true,
      auth: state,
      browser: ["AMASHIA MD BOT", "Safari", "1.0.0"],
      syncFullHistory: false
    });

    this.setupEventListeners(saveCreds);
  }

  // Setup event listeners
  setupEventListeners(saveCreds) {
    // Connection update
    this.sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log("📱 Scan this QR code with WhatsApp:");
      }

      if (connection === "connecting") {
        console.log("🔗 Connecting to WhatsApp...");
      }

      if (connection === "open") {
        this.isConnected = true;
        console.log("✅ Bot Connected Successfully!");
        console.log("💞 Always Online Mode: ACTIVE");
      }

      if (connection === "close") {
        this.isConnected = false;
        if (
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut
        ) {
          console.log("🔄 Reconnecting...");
          setTimeout(() => this.init(), 3000);
        } else {
          console.log("❌ Device logged out. Please scan QR again.");
        }
      }
    });

    // Save credentials
    this.sock.ev.on("creds.update", saveCreds);

    // Messages
    this.sock.ev.on("messages.upsert", async (m) => {
      try {
        const message = m.messages[0];
        if (!message.message) return;

        await this.handleMessage(message);
      } catch (error) {
        console.error("❌ Error handling message:", error);
      }
    });

    // Status updates
    this.sock.ev.on("messages.update", async (m) => {
      for (const msg of m) {
        if (config.features.autoStatusSeen && msg.status === 0) {
          await this.sock.chatModify({ markRead: true }, msg.key.remoteJid);
        }
      }
    });

    // Call events
    this.sock.ev.on("call", async (call) => {
      if (config.features.antiCall) {
        console.log(`📞 Incoming call from ${call[0].from} - BLOCKED`);
        await this.sock.rejectCall(call[0].id, call[0].from);
      }
    });
  }

  // Handle incoming messages
  async handleMessage(message) {
    const from = message.key.remoteJid;
    const isOwner = from.includes(config.ownerNumber);
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      "";

    if (!text.startsWith(config.prefix)) return;

    const command = text.slice(config.prefix.length).split(" ")[0];
    const args = text.slice(config.prefix.length + command.length).trim();

    // Fake typing
    if (config.features.fakeTyping) {
      await this.sock.sendPresenceUpdate("typing", from);
    }

    // Commands
    switch (command) {
      case "ping":
        await this.reply(from, message.key, "🏓 Pong! Bot is working!");
        break;

      case "help":
        await this.showHelp(from, message.key);
        break;

      case "status":
        await this.showStatus(from, message.key);
        break;

      case "mode":
        if (isOwner) {
          await this.changeMode(from, message.key, args);
        } else {
          await this.reply(from, message.key, "❌ Owner only command!");
        }
        break;

      case "setprefix":
        if (isOwner) {
          config.prefix = args[0] || ".";
          await this.reply(
            from,
            message.key,
            `✅ Prefix changed to: ${config.prefix}`
          );
        }
        break;

      case "react":
        await this.autoReact(from, message.key);
        break;

      default:
        if (config.features.smartAI) {
          await this.smartReply(from, message.key, text);
        }
    }
  }

  // Reply to message
  async reply(to, messageKey, text) {
    await this.sock.sendMessage(to, {
      text: text,
      quoted: { key: messageKey }
    });
  }

  // Show help command
  async showHelp(to, messageKey) {
    const helpText = `
╔═══════════════════════════════════════╗
║    🤖 AMASHIA MD BOT V.2 COMMANDS    ║
╚═══════════════════════════════════════╝

📋 Basic Commands:
${config.prefix}ping - Check bot status
${config.prefix}help - Show this message
${config.prefix}status - Bot information

⚙️ Owner Commands:
${config.prefix}mode - Change bot mode
${config.prefix}setprefix - Set bot prefix
${config.prefix}react - Auto react to message

✨ Features Active:
💞 Always Online
🔌 Fake Typing & Recording
🖇️ Auto Status Seen & Like
😋 Auto Status Reply
🌈 Auto React
📞 Anti Call
🤖 Mode Change
📥 Media Download
🎞️ Song For Channels
🎤 Smart AI

Made with ❤️ by AMASHIA Team
    `;
    await this.reply(to, messageKey, helpText);
  }

  // Show bot status
  async showStatus(to, messageKey) {
    const statusText = `
╔════════════════════════════════════╗
║      🤖 BOT STATUS INFORMATION     ║
╚════════════════════════════════════╝

📱 Bot Name: ${config.botName}
✅ Status: ${this.isConnected ? "ONLINE" : "OFFLINE"}
🎯 Prefix: ${config.prefix}
👤 Owner: ${config.ownerNumber}

🎨 Active Features:
${Object.entries(config.features)
  .map(([key, value]) => `${value ? "✅" : "❌"} ${key}`)
  .join("\n")}

Version: 2.0.0
Uptime: ${Math.floor(process.uptime())} seconds

Made with ❤️ by AMASHIA Team
    `;
    await this.reply(to, messageKey, statusText);
  }

  // Change bot mode
  async changeMode(to, messageKey, mode) {
    const modes = ["strict", "normal", "fun"];
    if (!mode || !modes.includes(mode)) {
      await this.reply(
        to,
        messageKey,
        `❌ Invalid mode! Use: ${modes.join(", ")}`
      );
      return;
    }

    await this.reply(
      to,
      messageKey,
      `✅ Bot mode changed to: ${mode.toUpperCase()}`
    );
  }

  // Auto react to messages
  async autoReact(to, messageKey) {
    const emojis = ["❤️", "😂", "😮", "😢", "👍", "🔥", "✨"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    await this.sock.sendMessage(to, {
      react: { text: randomEmoji, key: messageKey }
    });
  }

  // Smart AI reply
  async smartReply(to, messageKey, text) {
    const responses = [
      "That's interesting! 🤔",
      "I agree with you! 👍",
      "Tell me more! 📢",
      "Amazing! ✨",
      "Got it! 💯",
      "Cool! 😎",
      "Understood! 👌"
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    await this.reply(to, messageKey, randomResponse);
  }
}

// Initialize and start bot
const bot = new AmashiaBot();
bot.init().catch(console.error);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Bot shutting down...");
  process.exit(0);
});
