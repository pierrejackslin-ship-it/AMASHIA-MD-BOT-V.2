const { default: makeWASocket, useMultiFileAuthState } = require('baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
const PORT = 3000;

// ================== WHATSAPP BAILEYS ==================
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;

        if (qr) {
            console.log('Scan QR code anba a 👇');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log('✅ Bot konekte!');
        }

        if (connection === 'close') {
            console.log('❌ Dekonekte... rekonekte');
            startBot();
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];

        if (!msg.message) return;

        const text = msg.message.conversation || '';

        if (text.toLowerCase() === 'hi') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'Hello 👋 mwen la!' });
        }
    });
}

startBot();

// ================== WEB SERVER ==================
app.get('/', (req, res) => {
    res.send('🤖 Bot Baileys ap mache!');
});

app.listen(PORT, () => {
    console.log(`🌐 Server ap mache sou http://localhost:${PORT}`);
});