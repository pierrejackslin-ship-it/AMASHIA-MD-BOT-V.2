const express = require("express")
const app = express()

let pairingCode = "WAITING..."
let botStatus = "OFFLINE"

// 🌐 DASHBOARD PAGE
app.get("/", (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>AMASHIA MD BOT</title>
    <meta http-equiv="refresh" content="5">
    <style>
      body {
        font-family: Arial;
        background: #0d0d0d;
        color: #fff;
        text-align: center;
        padding: 40px;
      }
      .box {
        background: #1a1a1a;
        padding: 30px;
        border-radius: 12px;
        display: inline-block;
        box-shadow: 0 0 20px rgba(0,255,153,0.2);
      }
      h1 {
        color: #00ff99;
      }
      .status {
        font-size: 18px;
        margin: 10px 0;
      }
      .code {
        font-size: 28px;
        margin: 20px 0;
        color: #00ff99;
      }
      button {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        background: #00ff99;
        color: black;
        font-weight: bold;
        cursor: pointer;
      }
    </style>
  </head>
  <body>

    <div class="box">
      <h1>🤖 AMASHIA MD BOT</h1>

      <div class="status">
        Status: <b>${botStatus}</b>
      </div>

      <p>🔑 Pairing Code:</p>
      <div class="code" id="code">${pairingCode}</div>

      <button onclick="copyCode()">Copy Code</button>
    </div>

    <script>
      function copyCode() {
        const code = document.getElementById("code").innerText
        navigator.clipboard.writeText(code)
        alert("Code copied!")
      }
    </script>

  </body>
  </html>
  `)
})

// 🚀 START SERVER
app.listen(3000, () => {
  console.log("🌐 Chrome Dashboard: http://localhost:3000")
})

// 🔁 EXPORT FUNCTIONS
module.exports = {
  setCode: (c) => pairingCode = c,
  setStatus: (s) => botStatus = s
}