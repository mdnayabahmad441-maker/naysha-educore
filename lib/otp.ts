import crypto from "crypto"

const WINDOW_MS = 10 * 60 * 1000 // 10-minute validity window

function bucket(): number {
  return Math.floor(Date.now() / WINDOW_MS)
}

function compute(email: string, b: number): string {
  const hmac = crypto.createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
  hmac.update(`${email.toLowerCase()}:${b}`)
  const num = parseInt(hmac.digest("hex").slice(0, 8), 16)
  return String(num % 1_000_000).padStart(6, "0")
}

export function generateOtp(email: string): string {
  return compute(email, bucket())
}

export function verifyOtp(email: string, code: string): boolean {
  const b = bucket()
  const c = code.trim()
  return c === compute(email, b) || c === compute(email, b - 1)
}
