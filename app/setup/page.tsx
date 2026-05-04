"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { redirectWithSession } from "@/lib/auth-flow"

export default function SetupPage() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const usernameHint = useMemo(
    () => username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, ""),
    [username]
  )

  const setup = async () => {
    const normalizedUsername = usernameHint

    if (!normalizedUsername || normalizedUsername.length < 4) {
      alert("Username must be at least 4 characters")
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

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      alert("Login first")
      router.push("/login")
      return
    }

    setLoading(true)

    const resolveResponse = await fetch("/api/auth/resolve-identifier", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: normalizedUsername,
      }),
    })

    const resolveData = await resolveResponse.json()

    if (resolveResponse.ok && resolveData.email && resolveData.email !== user.email) {
      setLoading(false)
      alert("Username already taken")
      return
    }

    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        ...user.user_metadata,
        username: normalizedUsername,
        must_set_password: false,
      },
    })

    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    const pendingRedirect = sessionStorage.getItem("postAuthRedirect")

    if (pendingRedirect) {
      sessionStorage.removeItem("postAuthRedirect")
      await redirectWithSession(JSON.parse(pendingRedirect))
      return
    }

    setLoading(false)
    router.push("/login?setup=done")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_34%),linear-gradient(160deg,#06111b_0%,#0a1424_58%,#09101a_100%)] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-white/6 shadow-[0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(16,185,129,0.16),rgba(8,15,30,0.08))] p-8 lg:border-b-0 lg:border-r lg:p-10">
            <p className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200">
              Final Step
            </p>
            <h1 className="mt-5 text-3xl font-semibold leading-tight text-white">
              Create the credentials your ERP team will use every day.
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Your email is already verified. Now choose a username and password so future
              sign-ins feel like a proper ERP login instead of OTP every time.
            </p>

            <div className="mt-8 grid gap-4 text-sm text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-4">
                Use a school-friendly username like <span className="font-medium text-white">greenfield.admin</span>.
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-4">
                Password login will work with either your email or username.
              </div>
            </div>
          </section>

          <section className="p-8 lg:p-10">
            <div className="mx-auto max-w-md">
              <h2 className="text-2xl font-semibold text-white">
                Set Username And Password
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                These credentials stay linked to the verified email on your account.
              </p>

              <div className="mt-8 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Username
                  </label>
                  <input
                    placeholder="Enter username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-white placeholder:text-slate-500"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Saved as: <span className="text-slate-200">{usernameHint || "your.username"}</span>
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-white placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={setup}
                  disabled={loading}
                  className="w-full rounded-2xl bg-[linear-gradient(135deg,#10b981,#0f766e)] px-4 py-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Saving Credentials..." : "Save Credentials"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
