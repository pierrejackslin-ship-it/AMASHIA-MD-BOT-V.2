const express = require("express")
const app = express()

let pairingCode = "WAITING..."
let botStatus = "OFFLINE"

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>AMASHIA MD BOT</title>
        <style>
          body { font-family: Arial; background:#111; color:white; text-align:center; padding:50px; }
          .box { background:#222; padding:20px; border-radius:10px; display:inline-block; }
          h1 { color:#00ff99; }
        </style>
      </head>
      <body>
        <div class="box">
          <h1>🤖 AMASHIA MD BOT</h1>
          <p>Status: ${botStatus}</p>
          <p>🔑 Pairing Code:</p>
          <h2>${pairingCode}</h2>
        </div>
      </body>
    </html>
  `)
})

app.listen(3000, () => console.log("🌐 Chrome Dashboard: http://localhost:3000"))

module.exports = { setCode: (c) => pairingCode = c, setStatus: (s) => botStatus = s }