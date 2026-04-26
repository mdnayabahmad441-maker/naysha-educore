"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Manrope, Space_Grotesk } from "next/font/google"
import { supabase } from "@/lib/supabase"
import { redirectWithSession, resolveAuthDestination } from "@/lib/auth-flow"

const headingFont = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] })
const bodyFont = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

type ResolvedAccount = {
  email: string
  role: "admin" | "teacher" | "parent"
  loginMethod: "password" | "otp"
}

type Step =
  | { type: "email" }
  | { type: "password"; account: ResolvedAccount }
  | { type: "otp"; account: ResolvedAccount }

export default function LoginPage() {
  const searchParams = useSearchParams()
  const setupDone = searchParams.get("setup") === "done"
  const resetSent = searchParams.get("reset") === "sent"

  const [step, setStep] = useState<Step>({ type: "email" })
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // ── Step 1: identify account by email ────────────────────────────────────
  const handleIdentify = async () => {
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) { alert("Enter your email"); return }

    setLoading(true)
    const res = await fetch("/api/auth/resolve-identifier", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: normalizedEmail }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data?.email || !data?.role) {
      alert(data?.error || "Account not found — check your email and try again")
      return
    }

    const account: ResolvedAccount = { email: data.email, role: data.role, loginMethod: data.loginMethod }

    if (account.loginMethod === "otp") {
      setStep({ type: "otp", account })
    } else {
      setPassword("")
      setStep({ type: "password", account })
    }
  }

  // ── Step 2a: admin / teacher — password login ─────────────────────────────
  const handlePasswordLogin = async () => {
    if (step.type !== "password") return
    if (!password) { alert("Enter your password"); return }

    setLoading(true)
    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: step.account.email,
      password,
    })

    if (error || !loginData.user) {
      setLoading(false)
      alert(error?.message || "Incorrect password")
      return
    }

    try {
      const destination = await resolveAuthDestination(loginData.user, step.account.email, step.account.role)
      await redirectWithSession(destination)
    } catch (err) {
      setLoading(false)
      alert(err instanceof Error ? err.message : "Login failed — please try again")
    }
  }

  // ── Step 2b: parent — OTP sent from the browser (PKCE must stay client-side)
  const handleSendParentOtp = async () => {
    if (step.type !== "otp") return

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: step.account.email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)

    if (error) {
      alert(error.message || "Failed to send OTP — please try again")
      return
    }

    window.location.href = `/verify?email=${encodeURIComponent(step.account.email)}&mode=login&role=parent`
  }

  const back = () => { setStep({ type: "email" }); setPassword("") }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const account = step.type !== "email" ? step.account : null

  const roleLabel  = account?.role === "admin" ? "Admin" : account?.role === "teacher" ? "Teacher" : "Parent"
  const roleBadge  =
    account?.role === "admin"   ? "border-blue-400/20 bg-blue-400/10 text-blue-100" :
    account?.role === "teacher" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100" :
                                  "border-amber-300/20 bg-amber-300/10 text-amber-100"
  const actionBtn  =
    account?.role === "admin"   ? "bg-[linear-gradient(135deg,#2563eb,#0ea5e9)]" :
    account?.role === "teacher" ? "bg-[linear-gradient(135deg,#059669,#0ea5e9)]" :
                                  "bg-[linear-gradient(135deg,#f59e0b,#d97706)]"

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_right,rgba(34,197,94,0.10),transparent_26%),linear-gradient(145deg,#040b16_0%,#091120_46%,#050a13_100%)] text-white`}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-200/80">School ERP Platform</p>
            <h1 className={`${headingFont.className} mt-2 text-2xl font-bold text-white`}>NaySha EduCore</h1>
          </div>
          <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 md:block">
            Secure access for Admin, Teacher &amp; Parent
          </div>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 xl:grid-cols-[1.15fr_0.85fr]">

          {/* Left info panel */}
          <section className="hidden gap-6 xl:grid">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
                ERP Login Workspace
              </p>
              <h2 className={`${headingFont.className} text-5xl font-bold leading-tight text-white`}>
                One entry point.<br />Three role dashboards.
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">
                Enter your email. Admins and teachers continue with their password.
                Parents receive a one-time passcode — no password needed.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Admin", color: "border-blue-400/20 bg-blue-400/10 text-blue-100", detail: "Password login → full school management dashboard" },
                { label: "Teacher", color: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100", detail: "Password login → attendance, marks and student tools" },
                { label: "Parent", color: "border-amber-300/20 bg-amber-300/10 text-amber-100", detail: "OTP login → fees, results and attendance at a glance" },
              ].map((r) => (
                <div key={r.label} className={`rounded-3xl border px-5 py-5 ${r.color}`}>
                  <p className="text-base font-bold">{r.label}</p>
                  <p className="mt-2 text-sm leading-6 opacity-80">{r.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Right login card */}
          <section className="mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,15,30,0.92),rgba(7,12,22,0.86))] shadow-[0_26px_80px_rgba(2,8,23,0.42)] backdrop-blur">

              {/* Card header */}
              <div className="border-b border-white/10 px-6 py-6">
                <div className="xl:hidden mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/80">School ERP Platform</p>
                  <h1 className={`${headingFont.className} mt-1 text-2xl font-bold text-white`}>NaySha EduCore</h1>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_36%),linear-gradient(135deg,rgba(8,15,30,0.9),rgba(7,12,22,0.82))] px-5 py-5">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">Access Portal</p>
                  <h3 className={`${headingFont.className} mt-2 text-2xl font-semibold text-white`}>Sign In</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {step.type === "email"    && "Enter your registered email to continue."}
                    {step.type === "password" && `${roleLabel} account found. Enter your password.`}
                    {step.type === "otp"      && "Parent account found. We will send a one-time passcode."}
                  </p>
                </div>
              </div>

              {/* Card body */}
              <div className="space-y-4 px-6 py-6">

                {setupDone && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    Account setup complete — you can now sign in.
                  </div>
                )}
                {resetSent && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                    Password reset email sent. Check your inbox.
                  </div>
                )}

                {/* ── Email step ── */}
                {step.type === "email" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleIdentify()}
                        placeholder="Enter your registered email"
                        className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleIdentify}
                      disabled={loading}
                      className="w-full rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-4 py-4 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(14,116,144,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Checking..." : "Continue"}
                    </button>
                  </>
                )}

                {/* ── Password step (admin / teacher) ── */}
                {step.type === "password" && (
                  <>
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${roleBadge}`}>
                      <span className="font-semibold">{roleLabel}</span> · {step.account.email}
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                        placeholder="Enter your password"
                        autoFocus
                        className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={back} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3.5 text-sm font-semibold text-slate-200 hover:bg-white/10">
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handlePasswordLogin}
                        disabled={loading}
                        className={`rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${actionBtn}`}
                      >
                        {loading ? "Signing In..." : "Sign In"}
                      </button>
                    </div>
                    <div className="text-center">
                      <a href="/login/reset" className="text-xs text-slate-400 hover:text-slate-200">
                        Forgot password?
                      </a>
                    </div>
                  </>
                )}

                {/* ── OTP step (parent) ── */}
                {step.type === "otp" && (
                  <>
                    <div className={`rounded-2xl border px-4 py-3 text-sm ${roleBadge}`}>
                      <span className="font-semibold">Parent</span> · {step.account.email}
                    </div>
                    <p className="text-sm text-slate-300 leading-6">
                      Tap <strong className="text-white">Send OTP</strong> and we will email a 6-digit code to{" "}
                      <span className="font-medium text-white">{step.account.email}</span>.
                      Enter it on the next screen to open your dashboard.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={back} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3.5 text-sm font-semibold text-slate-200 hover:bg-white/10">
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSendParentOtp}
                        disabled={loading}
                        className={`rounded-2xl px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${actionBtn}`}
                      >
                        {loading ? "Sending..." : "Send OTP"}
                      </button>
                    </div>
                  </>
                )}

                {/* Onboarding link */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">New school?</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">Register your school before using the login flow.</p>
                  <a
                    href="/onboarding"
                    className="mt-3 block rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
                  >
                    Create School Account
                  </a>
                </div>

              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
