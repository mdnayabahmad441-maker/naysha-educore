import pkg from "whatsapp-web.js"
import qrcode from "qrcode-terminal"

const { Client, LocalAuth } = pkg

const client = new Client({
  authStrategy: new LocalAuth(),
})

client.on("qr", (qr: string) => {
  console.log("Scan this QR with your WhatsApp:")
  qrcode.generate(qr, { small: true })
})

client.on("ready", () => {
  console.log("WhatsApp is ready ✅")
})

client.initialize()

export async function sendWhatsApp(phone: string, message: string) {
  const formattedNumber = `91${phone}@c.us`

  return client.sendMessage(formattedNumber, message)
}