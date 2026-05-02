"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Manrope, Space_Grotesk } from "next/font/google"
import { supabase } from "@/lib/supabase"
import { redirectWithSession, resolveAuthDestination } from "@/lib/auth-flow"

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
})

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

type ResolvedAccount = {
  email: string
  role: "admin" | "teacher" | "parent"
  loginMethod: "password" | "otp"
}

export default function LoginPage() {
  const searchParams = useSearchParams()

  const [helperMode, setHelperMode] = useState<"none" | "setup" | "reset">("none")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [setupEmail, setSetupEmail] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resolvedAccount, setResolvedAccount] = useState<ResolvedAccount | null>(null)

  const setupDone = searchParams.get("setup") === "done"
  const resetSent = searchParams.get("reset") === "sent"

  const identifyAccount = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      alert("Enter your email")
      return
    }

    setLoading(true)

    const response = await fetch("/api/auth/resolve-identifier", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: normalizedEmail,
      }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok || !data?.email || !data?.role || !data?.loginMethod) {
      alert(data?.error || "Account not found")
      return
    }

    setResolvedAccount(data)
    setPassword("")
  }

  const backToEmailStep = () => {
    setResolvedAccount(null)
    setPassword("")
  }

  const loginWithPassword = async () => {
    if (!resolvedAccount?.email || !password) {
      alert("Enter your password")
      return
    }

    setLoading(true)

    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email: resolvedAccount.email,
      password,
    })

    if (error || !loginData.user) {
      setLoading(false)
      alert(error?.message || "Login failed")
      return
    }

    try {
      const destination = await resolveAuthDestination(
        loginData.user,
        resolvedAccount.email,
        resolvedAccount.role
      )
      await redirectWithSession(destination)
    } catch (authError) {
      setLoading(false)
      alert(authError instanceof Error ? authError.message : "Unable to continue login")
    }
  }

  const sendParentOtp = async () => {
    if (!resolvedAccount?.email) return

    setLoading(true)

    // Ensure Supabase auth user exists for this parent (server-side admin)
    await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resolvedAccount.email }),
    })

    // Send OTP from browser — Supabase delivers via its own email provider
    const { error } = await supabase.auth.signInWithOtp({
      email: resolvedAccount.email,
      options: { shouldCreateUser: false },
    })

    setLoading(false)

    if (error) {
      alert(error.message || "Failed to send OTP")
      return
    }

    window.location.href = `/verify?email=${encodeURIComponent(resolvedAccount.email)}&mode=login&role=parent`
  }

  const startExistingAccountSetup = async () => {
    const normalizedEmail = setupEmail.trim().toLowerCase()

    if (!normalizedEmail) {
      alert("Enter your existing school email")
      return
    }

    setSetupLoading(true)

    // Ensures Supabase auth user exists for any registered role (teacher, admin, parent)
    const setupRes = await fetch("/api/auth/setup-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    })

    if (!setupRes.ok) {
      setSetupLoading(false)
      const data = await setupRes.json().catch(() => ({}))
      alert(data?.error || "Failed to prepare account")
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    })

    setSetupLoading(false)

    if (error) {
      alert(error.message || "Failed to send OTP")
      return
    }

    window.location.href = `/verify?email=${encodeURIComponent(normalizedEmail)}&mode=setup`
  }

  const requestPasswordReset = async () => {
    const normalizedEmail = resetEmail.trim().toLowerCase()

    if (!normalizedEmail) {
      alert("Enter your account email")
      return
    }

    setResetLoading(true)

    const response = await fetch("/api/auth/request-password-reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: normalizedEmail,
      }),
    })

    setResetLoading(false)

    const data = await response.json()

    if (!response.ok) {
      alert(data.error || "Failed to send password reset email")
      return
    }

    window.location.href = "/login?reset=sent"
  }

  const roleLabel =
    resolvedAccount?.role === "admin" ? "Admin" :
    resolvedAccount?.role === "teacher" ? "Teacher" :
    resolvedAccount?.role === "parent" ? "Parent" :
    null

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.16),_transparent_28%),radial-gradient(circle_at_right,_rgba(34,197,94,0.10),_transparent_26%),linear-gradient(145deg,#040b16_0%,#091120_46%,#050a13_100%)] text-white`}>
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
            Email-first access for Admin, Teacher and Parent panels
          </div>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="hidden gap-6 xl:grid">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
                ERP Login Workspace
              </p>
              <h2 className={`${headingFont.className} text-4xl font-bold leading-tight text-white md:text-6xl`}>
                One login entry, then the ERP chooses the right path.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                Enter your email first. Admins and teachers continue with password login,
                while parents stay on OTP verification for simpler family access.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { title: "Email First", text: "The system checks the account type before asking for the next login step." },
                { title: "Staff Password Login", text: "Admins and teachers use password-based sign-in after email detection." },
                { title: "Parent OTP Login", text: "Parents get a one-time passcode flow that works well on phones." },
                { title: "Role-Based Routing", text: "Each user lands directly in the correct school panel after authentication." },
                { title: "First-Time Setup", text: "Existing school accounts can create credentials through email verification once." },
                { title: "Multi-School Ready", text: "After login, users are redirected into the correct tenant workspace automatically." },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_16px_44px_rgba(2,8,23,0.22)]"
                >
                  <h3 className={`${headingFont.className} text-lg font-semibold text-white`}>
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </section>

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

                <div className="mt-4 rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_36%),linear-gradient(135deg,rgba(8,15,30,0.9),rgba(7,12,22,0.82))] px-4 py-4 shadow-[0_18px_50px_rgba(2,8,23,0.3)]">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">
                    Access Portal
                  </p>
                  <h3 className={`${headingFont.className} mt-3 text-2xl font-semibold text-white sm:text-3xl`}>
                    Sign In
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Start with your email. We will switch to password or OTP based on your role.
                  </p>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-7 sm:py-7">
                {setupDone ? (
                  <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    Account setup completed. You can now sign in with your email and password.
                  </div>
                ) : null}

                {resetSent ? (
                  <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                    Password reset email sent. Please check your inbox.
                  </div>
                ) : null}

                <div className="space-y-4 rounded-[26px] border border-white/10 bg-white/5 p-4 sm:p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Login
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Identify the account first, then continue with the right sign-in method.
                    </p>
                  </div>

                  {!resolvedAccount ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="Enter your email"
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
                  ) : resolvedAccount.loginMethod === "password" ? (
                    <>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                        {roleLabel} account found for <span className="font-semibold">{resolvedAccount.email}</span>.
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-200">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Enter password"
                          className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3.5 text-white placeholder:text-slate-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={backToEmailStep}
                          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                        >
                          Change Email
                        </button>
                        <button
                          type="button"
                          onClick={loginWithPassword}
                          disabled={loading}
                          className="rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loading ? "Signing In..." : "Login"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                        Parent account found for <span className="font-semibold">{resolvedAccount.email}</span>.
                        Continue with OTP login.
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={backToEmailStep}
                          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                        >
                          Change Email
                        </button>
                        <button
                          type="button"
                          onClick={sendParentOtp}
                          disabled={loading}
                          className="rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {loading ? "Sending OTP..." : "Send OTP"}
                        </button>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setHelperMode(helperMode === "setup" ? "none" : "setup")}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        helperMode === "setup"
                          ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
                          : "border-white/10 bg-white/6 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      First-Time Setup
                    </button>
                    <button
                      type="button"
                      onClick={() => setHelperMode(helperMode === "reset" ? "none" : "reset")}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        helperMode === "reset"
                          ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-white/6 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      Reset Password
                    </button>
                  </div>
                </div>

                {helperMode === "setup" ? (
                  <div className="mt-4 rounded-[26px] border border-amber-300/20 bg-amber-300/10 p-4 sm:p-5">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Set password for an existing school account
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        Use your school email. We will verify it with OTP first, then let you create your password.
                      </p>
                    </div>

                    <div className="mt-4 space-y-3">
                      <input
                        type="email"
                        value={setupEmail}
                        onChange={(event) => setSetupEmail(event.target.value)}
                        placeholder="Enter existing school email"
                        className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3.5 text-white placeholder:text-slate-500"
                      />

                      <button
                        type="button"
                        onClick={startExistingAccountSetup}
                        disabled={setupLoading}
                        className="w-full rounded-2xl border border-amber-200/20 bg-[linear-gradient(135deg,#f59e0b,#d97706)] px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {setupLoading ? "Sending OTP..." : "Verify Email And Set Password"}
                      </button>
                    </div>
                  </div>
                ) : null}

                {helperMode === "reset" ? (
                  <div className="mt-4 rounded-[26px] border border-cyan-300/20 bg-cyan-300/10 p-4 sm:p-5">
                    <p className="text-sm font-semibold text-white">
                      Forgot password
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Request a reset link for admin and teacher accounts.
                    </p>

                    <div className="mt-4 space-y-3">
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(event) => setResetEmail(event.target.value)}
                        placeholder="Enter account email"
                        className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-3.5 text-white placeholder:text-slate-500"
                      />

                      <button
                        type="button"
                        onClick={requestPasswordReset}
                        disabled={resetLoading}
                        className="w-full rounded-2xl border border-cyan-200/20 bg-[linear-gradient(135deg,#0891b2,#2563eb)] px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {resetLoading ? "Sending Reset..." : "Send Password Reset"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">
                    First-time school onboarding
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    New school admins should start here before using the login flow.
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
