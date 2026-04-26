"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { redirectWithSession, resolveAuthDestination } from "@/lib/auth-flow"

export default function VerifyPageClient() {
  const params = useSearchParams()
  const router = useRouter()
  const email = (params.get("email") || "").trim().toLowerCase()
  const mode = params.get("mode") || "login"
  const preferredRole =
    params.get("role") === "parent" ||
    params.get("role") === "teacher" ||
    params.get("role") === "admin"
      ? (params.get("role") as "admin" | "teacher" | "parent")
      : undefined

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Email missing. Please start again from the login page.
      </div>
    )
  }

  const verify = async () => {
    if (!otp.trim()) {
      alert("Enter OTP")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    })

    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    const { data: userData } = await supabase.auth.getUser()

    if (!userData.user) {
      setLoading(false)
      alert("User not found")
      return
    }

    try {
      const destination = await resolveAuthDestination(userData.user, email, preferredRole)

      if (mode === "setup") {
        sessionStorage.setItem("postAuthRedirect", JSON.stringify(destination))
        router.push("/setup")
        return
      }

      await redirectWithSession(destination)
    } catch (authError) {
      alert(authError instanceof Error ? authError.message : "Verification failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_38%),linear-gradient(160deg,#07111f_0%,#0b182b_58%,#08101d_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/6 shadow-[0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur xl:grid-cols-[1.15fr_0.85fr]">
          <section className="hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(14,116,144,0.16),rgba(8,15,30,0.08))] p-10 xl:flex xl:flex-col xl:justify-between">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Account Verification
              </p>
              <h1 className="max-w-md text-4xl font-semibold leading-tight text-white">
                Secure the ERP account before you enter the workspace.
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
                We sent a one-time passcode to <span className="font-medium text-white">{email}</span>.
                Verify the email first, then we will finish your school access setup.
              </p>
            </div>

            <div className="grid gap-4 text-sm text-slate-200">
              {[
                "Email verification protects student and finance data.",
                "New accounts set their username and password after OTP verification.",
                "Existing users are redirected straight into their school dashboard.",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-4">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-8">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">
                  NaySha EduCore
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-white">
                  Verify Email OTP
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Enter the OTP from your inbox to continue into the ERP.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/30 p-6">
                <label className="mb-3 block text-sm font-medium text-slate-200">
                  One-time passcode
                </label>
                <input
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-lg tracking-[0.3em] text-white placeholder:text-slate-500"
                />

                <button
                  type="button"
                  onClick={verify}
                  disabled={loading}
                  className="mt-5 w-full rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-4 py-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Verifying..." : "Verify And Continue"}
                </button>
              </div>

              <p className="mt-5 text-sm text-slate-400">
                Need a different email? <a href="/login" className="text-cyan-300 hover:text-cyan-200">Return to sign in</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
