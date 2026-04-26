"use client"

import { useState } from "react"
import { Manrope, Space_Grotesk } from "next/font/google"

const headingFont = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] })
const bodyFont = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleReset = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) { setError("Enter your email"); return }

    setLoading(true)
    setError("")

    const res = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data?.error || "Failed to send reset email")
      return
    }

    setSent(true)
  }

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_28%),linear-gradient(145deg,#040b16_0%,#091120_46%,#050a13_100%)] text-white`}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-10">

        <div className="w-full overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,30,0.92),rgba(7,12,22,0.86))] shadow-[0_26px_80px_rgba(2,8,23,0.42)]">

          <div className="border-b border-white/10 px-6 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/80">NaySha EduCore</p>
            <h1 className={`${headingFont.className} mt-2 text-2xl font-bold text-white`}>Reset Password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Enter your admin or teacher email and we will send a reset link.
            </p>
          </div>

          <div className="space-y-4 px-6 py-6">
            {sent ? (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-5 text-sm text-emerald-100">
                <p className="font-semibold text-white">Reset link sent</p>
                <p className="mt-1 leading-6">
                  Check your inbox at <span className="font-medium text-white">{email}</span>.
                  Click the link in the email to set a new password.
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    placeholder="Enter your account email"
                    autoFocus
                    className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="w-full rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-4 py-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </>
            )}

            <a
              href="/login"
              className="block text-center text-sm text-slate-400 hover:text-slate-200"
            >
              Back to sign in
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
