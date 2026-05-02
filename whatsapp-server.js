const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")
const http = require("http")
const fs = require("fs")
const path = require("path")

// Clean up lockfile on exit so next restart doesn't get EBUSY
const lockfilePath = path.join(__dirname, ".wwebjs_auth", "session", "lockfile")
const cleanLockfile = () => {
  try { fs.unlinkSync(lockfilePath) } catch {}
}
process.on("exit", cleanLockfile)
process.on("SIGINT", () => { cleanLockfile(); process.exit() })
process.on("SIGTERM", () => { cleanLockfile(); process.exit() })

// Use system Chrome — more stable than bundled Chromium on Node 24
const CHROME_PATH =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

let isReady = false
const client = new Client({
  authStrategy: new LocalAuth(),
  webVersion: "2.2412.54",
  webVersionCache: { type: "local" },
  puppeteer: {
    headless: true,
    executablePath: CHROME_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
    ],
  },
})

client.on("qr", (qr) => {
  console.log("\n📱 Scan this QR code with WhatsApp on your phone:\n")
  qrcode.generate(qr, { small: true })
})

client.on("ready", () => {
  isReady = true
  console.log("✅ WhatsApp is ready and connected!")
})

client.on("disconnected", () => {
  isReady = false
  console.log("❌ WhatsApp disconnected. Restart the server and scan QR again.")
})

client.initialize()

// HTTP server so Next.js can send messages via POST /send
const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json")

  if (req.method === "GET" && req.url === "/status") {
    res.end(JSON.stringify({ ready: isReady }))
    return
  }

  if (req.method === "POST" && req.url === "/send") {
    let body = ""
    req.on("data", (chunk) => (body += chunk))
    req.on("end", async () => {
      try {
        const { phone, message } = JSON.parse(body)

        if (!phone || !message) {
          res.statusCode = 400
          res.end(JSON.stringify({ success: false, error: "Missing phone or message" }))
          return
        }

        if (!isReady) {
          res.statusCode = 503
          res.end(JSON.stringify({ success: false, error: "WhatsApp not connected. Scan QR first." }))
          return
        }

        // Resolve the correct WhatsApp ID for the number
        const digits = phone.replace(/\D/g, "")
        const numberId = await client.getNumberId(digits)

        if (!numberId) {
          res.statusCode = 404
          res.end(JSON.stringify({ success: false, error: `Number ${digits} is not on WhatsApp` }))
          return
        }

        await client.sendMessage(numberId._serialized, message)
        res.end(JSON.stringify({ success: true, to: chatId }))
      } catch (err) {
        console.error("Send error:", err.message)
        res.statusCode = 500
        res.end(JSON.stringify({ success: false, error: err.message }))
      }
    })
    return
  }

  res.statusCode = 404
  res.end(JSON.stringify({ error: "Not found" }))
})

server.listen(3001, () => {
  console.log("🚀 WhatsApp server running on http://localhost:3001")
  console.log("   POST /send  { phone, message }")
  console.log("   GET  /status")
})
