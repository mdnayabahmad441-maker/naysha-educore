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

export default function LoginPage() {
  const searchParams = useSearchParams()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const setupDone = searchParams.get("setup") === "done"

  const loginWithPassword = async () => {
    const normalizedIdentifier = identifier.trim().toLowerCase()

    if (!normalizedIdentifier || !password) {
      alert("Enter username/email and password")
      return
    }

    setLoading(true)

    let email = normalizedIdentifier

    if (!normalizedIdentifier.includes("@")) {
      const response = await fetch("/api/auth/resolve-identifier", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: normalizedIdentifier,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.email) {
        setLoading(false)
        alert("Username not found")
        return
      }

      email = data.email
    }

    const { data: loginData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !loginData.user) {
      setLoading(false)
      alert(error?.message || "Login failed")
      return
    }

    try {
      const destination = await resolveAuthDestination(loginData.user, loginData.user.email || email)
      await redirectWithSession(destination)
    } catch (authError) {
      setLoading(false)
      alert(authError instanceof Error ? authError.message : "Unable to continue login")
    }
  }

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
            Secure access for Admin, Teacher and Parent panels
          </div>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="grid gap-6">
            <div className="max-w-3xl">
              <p className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200">
                ERP Login Workspace
              </p>
              <h2 className={`${headingFont.className} text-4xl font-bold leading-tight text-white md:text-6xl`}>
                A real school ERP login, built for daily operations.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">
                Sign in with your email or username and password. New school accounts are created
                through email OTP verification first, then you set your own credentials once.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { title: "Operations Dashboard", text: "Admissions, fees, exams and attendance under one secured workspace." },
                { title: "Role-Based Routing", text: "Admin, teacher and parent access lands in the right panel automatically." },
                { title: "Verified Account Setup", text: "Email OTP is used only to activate accounts and keep onboarding secure." },
                { title: "Username Support", text: "Teams can sign in with school-friendly usernames instead of remembering long emails." },
                { title: "Audit-Friendly Access", text: "Credential-based sign-in feels closer to a production ERP than repeated OTP prompts." },
                { title: "Multi-School Ready", text: "Each user is redirected into the correct school domain after authentication." },
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
              <div className="border-b border-white/10 px-7 py-6">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-200/80">
                  Access Portal
                </p>
                <h3 className={`${headingFont.className} mt-3 text-3xl font-semibold text-white`}>
                  Sign In
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Use your email or username with password to enter the ERP securely.
                </p>
              </div>

              <div className="px-7 py-7">
                {setupDone ? (
                  <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                    Account setup completed. You can now sign in with your email or username and password.
                  </div>
                ) : null}

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-200">
                      Email or username
                    </label>
                    <input
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Enter email or username"
                      className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-white placeholder:text-slate-500"
                    />
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
                      className="w-full rounded-2xl border border-white/10 bg-[#08111f] px-4 py-4 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={loginWithPassword}
                    disabled={loading}
                    className="w-full rounded-2xl bg-[linear-gradient(135deg,#0ea5e9,#2563eb)] px-4 py-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? "Signing In..." : "Sign In To ERP"}
                  </button>
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">
                    First-time account creation
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    New school admins should create the account with email OTP first. After verification,
                    the system will ask for a username and password so future logins feel like a real ERP.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <a
                      href="/onboarding"
                      className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-center text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
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
