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
  role: "admin" | "teacher" | "parent" | "super_admin"
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

    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resolvedAccount.email }),
    })

    if (!res.ok) {
      setLoading(false)
      const data = await res.json().catch(() => ({}))
      alert(data?.error || "Failed to prepare account")
      return
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: resolvedAccount.email,
      options: { shouldCreateUser: true },
    })

    setLoading(false)

    if (error) {
      alert(error.message || "Failed to send OTP")
      return
    }

    window.location.href = `/verify?email=${encodeURIComponent(resolvedAccount.email)}&mode=login&role=parent`
  }

  const sendTeacherSetupOtp = async () => {
    if (!resolvedAccount?.email) return

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: resolvedAccount.email,
      options: { shouldCreateUser: false },
    })

    setLoading(false)

    if (error) {
      alert(error.message || "Failed to send verification code")
      return
    }

    window.location.href = `/verify?email=${encodeURIComponent(resolvedAccount.email)}&mode=setup&role=teacher`
  }

  const startExistingAccountSetup = async () => {
    const normalizedEmail = setupEmail.trim().toLowerCase()

    if (!normalizedEmail) {
      alert("Enter your existing school email")
      return
    }

    setSetupLoading(true)

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
    resolvedAccount?.role === "super_admin" ? "Super Admin" :
    null

  return (
    <div className={`${bodyFont.className} min-h-screen bg-[#050b14] text-white`}>
      <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-6 sm:px-6">
        <section className="w-full">
          <div className="rounded-2xl border border-white/10 bg-[#0b1424] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="mb-6">
              <h2 className={`${headingFont.className} text-2xl font-semibold`}>Sign in</h2>
              <p className="mt-2 text-sm text-slate-400">
                Use your registered email to continue.
              </p>
            </div>

            {setupDone ? (
              <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                Account setup completed. You can now sign in with your email and password.
              </div>
            ) : null}

            {resetSent ? (
              <div className="mb-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
                Password reset email sent. Please check your inbox.
              </div>
            ) : null}

            <div className="space-y-4">
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
                      className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={identifyAccount}
                    disabled={loading}
                    className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Checking Account..." : "Continue"}
                  </button>
                </>
              ) : resolvedAccount.loginMethod === "password" ? (
                <>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
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
                      className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={backToEmailStep}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={loginWithPassword}
                      disabled={loading}
                      className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Signing In..." : "Login"}
                    </button>
                  </div>
                </>
              ) : resolvedAccount.role === "teacher" ? (
                <>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    <p className="font-semibold">First login setup</p>
                    <p className="mt-1 text-emerald-200/80">
                      Verification code will be sent to <span className="font-medium text-white">{resolvedAccount.email}</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={backToEmailStep}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={sendTeacherSetupOtp}
                      disabled={loading}
                      className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Sending Code..." : "Send Code"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    Parent account found for <span className="font-semibold">{resolvedAccount.email}</span>.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={backToEmailStep}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
                    >
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={sendParentOtp}
                      disabled={loading}
                      className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
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
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    helperMode === "setup"
                      ? "border-amber-300/30 bg-amber-300/15 text-amber-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  Setup
                </button>
                <button
                  type="button"
                  onClick={() => setHelperMode(helperMode === "reset" ? "none" : "reset")}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    helperMode === "reset"
                      ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100"
                      : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  }`}
                >
                  Reset Password
                </button>
              </div>
            </div>

            {helperMode === "setup" ? (
              <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4">
                <p className="text-sm font-semibold text-white">First-time setup</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Verify your school email and create your password.
                </p>
                <div className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={setupEmail}
                    onChange={(event) => setSetupEmail(event.target.value)}
                    placeholder="Enter existing school email"
                    className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-amber-300/50"
                  />
                  <button
                    type="button"
                    onClick={startExistingAccountSetup}
                    disabled={setupLoading}
                    className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {setupLoading ? "Sending OTP..." : "Verify Email"}
                  </button>
                </div>
              </div>
            ) : null}

            {helperMode === "reset" ? (
              <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                <p className="text-sm font-semibold text-white">Forgot password</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Request a reset link for admin and teacher accounts.
                </p>
                <div className="mt-4 space-y-3">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    placeholder="Enter account email"
                    className="w-full rounded-xl border border-white/10 bg-[#07101d] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
                  />
                  <button
                    type="button"
                    onClick={requestPasswordReset}
                    disabled={resetLoading}
                    className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {resetLoading ? "Sending Reset..." : "Send Reset Link"}
                  </button>
                </div>
              </div>
            ) : null}

          </div>
        </section>
      </main>
    </div>
  )
}
