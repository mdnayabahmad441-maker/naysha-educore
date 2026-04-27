"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // ✅ STEP 1: Handle recovery session from email link
  useEffect(() => {
    const handleSession = async () => {
      try {
        const hash = window.location.hash

        if (!hash) {
          setErrorMsg("Invalid or expired reset link")
          return
        }

        const params = new URLSearchParams(hash.replace("#", ""))

        const access_token = params.get("access_token")
        const refresh_token = params.get("refresh_token")

        if (!access_token || !refresh_token) {
          setErrorMsg("Invalid reset link")
          return
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (error) {
          setErrorMsg("Session expired. Please request reset again.")
          return
        }

        setSessionReady(true)
      } catch (err) {
        setErrorMsg("Something went wrong. Try again.")
      }
    }

    handleSession()
  }, [])

  // ✅ STEP 2: Update password
  const submit = async () => {
    if (!sessionReady) {
      alert("Session not ready. Please try again.")
      return
    }

    if (password.length < 8) {
      alert("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    alert("Password updated successfully")
    router.push("/login")
  }

  // ❌ If link invalid
  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020c1b] text-white">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-3">Reset Failed</h2>
          <p className="text-red-400">{errorMsg}</p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(160deg,#06111b_0%,#0a1424_58%,#09101a_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-[28px] border border-white/10 bg-white/6 p-8 shadow-[0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur lg:p-10">

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
            Password Recovery
          </p>

          <h1 className="mt-4 text-3xl font-semibold text-white">
            Set a new password
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Choose a strong password (minimum 8 characters).
          </p>

          {!sessionReady ? (
            <p className="mt-6 text-sm text-yellow-400">
              Verifying reset link...
            </p>
          ) : (
            <div className="mt-8 space-y-4">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-white placeholder:text-slate-500"
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-white placeholder:text-slate-500"
              />

              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,#0891b2,#2563eb)] px-4 py-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}