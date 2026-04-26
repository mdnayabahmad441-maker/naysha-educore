"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Manrope, Space_Grotesk } from "next/font/google"
import { supabase } from "@/lib/supabase"

const headingFont = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] })
const bodyFont = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

type ResolvedAccount = {
  email: string
  role: "admin" | "teacher" | "parent"
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const setupDone = searchParams.get("setup") === "done"

  const [email, setEmail] = useState("")
  const [resolvedAccount, setResolvedAccount] = useState<ResolvedAccount | null>(null)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)

  const identifyAccount = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      alert("Enter your email")
      return
    }

    setLoading(true)

    const response = await fetch("/api/auth/resolve-identifier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: normalizedEmail }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok || !data?.email || !data?.role) {
      alert(data?.error || "Account not found")
      return
    }

    setResolvedAccount({ email: data.email, role: data.role })
  }

  const sendOtp = async () => {
    if (!resolvedAccount?.email) return

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: resolvedAccount.email,
      options: { shouldCreateUser: true },
    })

    setLoading(false)

    if (error) {
      alert(error.message || "Failed to send OTP")
      return
    }

    setOtpSent(true)

    window.location.href = `/verify?email=${encodeURIComponent(resolvedAccount.email)}&mode=login&role=${resolvedAccount.role}`
  }

  const roleLabel =
    resolvedAccount?.role === "admin" ? "Admin" :
    resolvedAccount?.role === "teacher" ? "Teacher" :
    resolvedAccount?.role === "parent" ? "Parent" : null

  const roleBadgeStyle =
    resolvedAccount?.role === "admin"
      ? "border-blue-400/20 bg-blue-400/10 text-blue-100"
      : resolvedAccount?.role === "teacher"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
      : "border-amber-300/20 bg-amber-300/10 text-amber-100"

  const otpButtonStyle =
    resolvedAccount?.role === "admin"
      ? "bg-[linear-gradient(135deg,#2563eb,#0ea5e9)]"
      : resolvedAccount?.role === "teacher"
      ? "bg-[linear-gradient(135deg,#059669,#0ea5e9)]"
      : "bg-[linear-gradient(135deg,#f59e0b,#d97706)]"

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_right,rgba(34,197,94,0.10),transparent_26%),linear-gradient(145deg,#040b16_0%,#091120_46%,#050a13_100%)] text-white`}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">

        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">
              School ERP Platform
            </p>
            <h1 className={`${headingFont.className} mt-2 text-2xl font-bold text-white`}>
              NaySha EduCore
            </h1>
          </div>
          <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 md:block">
            Secure OTP login for all roles
          </div>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 xl:grid-cols-[1.15fr_0.85fr]">

          {/* Left panel */}
          <section className="hidden gap-6 xl:grid">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
                ERP Login Workspace
              </p>
              <h2 className={`${headingFont.className} text-4xl font-bold leading-tight text-white md:text-6xl`}>
                Enter your email. Get your OTP. Open your dashboard.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                All users — admins, teachers, and parents — sign in with a one-time passcode
                sent to their registered email. No passwords to remember.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { title: "Email First", text: "The system detects your role automatically from the email you enter." },
                { title: "OTP for Everyone", text: "Admins, teachers, and parents all use a secure one-time passcode." },
                { title: "Admin Dashboard", text: "School admins land directly in the admin control panel." },
                { title: "Teacher Workspace", text: "Teachers get straight into attendance, marks, and class tools." },
                { title: "Parent Panel", text: "Parents can check fees, results, and attendance from any device." },
                { title: "Multi-School Ready", text: "After login, users are routed into the correct school workspace." },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_16px_44px_rgba(2,8,23,0.22)]"
                >
                  <h3 className={`${headingFont.className} text-lg font-semibold text-white`}>
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          {/* Right panel */}
          <section className="mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,30,0.92),rgba(7,12,22,0.86))] shadow-[0_26px_80px_rgba(2,8,23,0.42)] backdrop-blur">

              <div className="border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6">
                <div className="xl:hidden">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                    School ERP Platform
                  </p>
                  <h1 className={`${headingFont.className} mt-2 text-2xl font-bold text-white`}>
                    NaySha EduCore
                  </h1>
                </div>
                <div className="mt-4 rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_36%),linear-gradient(135deg,rgba(8,15,30,0.9),rgba(7,12,22,0.82))] px-4 py-4">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">
                    Access Portal
                  </p>
                  <h3 className={`${headingFont.className} mt-3 text-2xl font-semibold text-white sm:text-3xl`}>
                    Sign In
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Enter your email. We will send a one-time passcode to verify it.
                  </p>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-7 sm:py-7">
                {setupDone && (
                  <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    Account setup completed. You can now sign in with your email.
                  </div>
                )}

                <div className="space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-4 sm:p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Login</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Works for admins, teachers, and parents.
                    </p>
                  </div>

                  {!resolvedAccount ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && identifyAccount()}
                          placeholder="Enter your registered email"
                          className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3.5 text-white placeholder:text-slate-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={identifyAccount}
                        disabled={loading}
                        className="w-full rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(14,116,144,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {loading ? "Checking Account..." : "Continue"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={`rounded-2xl border px-4 py-3 text-sm ${roleBadgeStyle}`}>
                        <span className="font-semibold">{roleLabel}</span> account found for{" "}
                        <span className="font-semibold">{resolvedAccount.email}</span>.
                        We will send a one-time passcode to this address.
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => { setResolvedAccount(null); setOtpSent(false) }}
                          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                        >
                          Change Email
                        </button>
                        <button
                          type="button"
                          onClick={sendOtp}
                          disabled={loading || otpSent}
                          className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 ${otpButtonStyle}`}
                        >
                          {loading ? "Sending..." : otpSent ? "OTP Sent" : "Send OTP"}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">First-time school onboarding</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    New schools register here before using the login flow.
                  </p>
                  <div className="mt-4">
                    <a
                      href="/onboarding"
                      className="block rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                    >
                      Create School Account
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
