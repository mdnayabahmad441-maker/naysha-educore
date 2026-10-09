"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { Manrope, Space_Grotesk } from "next/font/google"
import { supabase } from "@/lib/supabase"
import { redirectWithSession, resolveAuthDestination } from "@/lib/auth-flow"
import { useSchool } from "@/context/SchoolContext"

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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

// ── SVG Icons ────────────────────────────────────────────────────────────────
function MailIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function LockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ShieldCheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

function UserPlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  )
}

function KeyRoundIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 18.5 7 14" />
      <path d="m3 14 3.5 3.5" />
      <path d="m14 4 7 7-7 7-7-7 7-7Z" />
      <circle cx="14" cy="9" r="2" />
    </svg>
  )
}

function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const school = useSchool()

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

    try {
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
    } catch {
      setLoading(false)
      alert("Connection error. Please try again.")
    }
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
    <div className={`${bodyFont.className} min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/20 selection:text-cyan-200`}>
      {/* Background ambient lighting glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[128px]" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[26rem] h-[26rem] bg-indigo-600/10 rounded-full blur-[130px]" />
      </div>

      {/* Main Split Screen Container */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen">
        
        {/* ════════════════════════════════════════════════════════════════
            LEFT SIDE: Marketing & Product Showcase (58% width on desktop)
            ════════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between p-8 xl:p-14 2xl:p-16 border-r border-white/5 bg-gradient-to-br from-[#060e1d]/90 via-[#030814]/90 to-[#02050c]/90 backdrop-blur-sm">
          
          {/* Top Brand Header */}
          <div>
            <div className="flex items-center gap-3.5">
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-1 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo.png"
                  alt="NaySha EduCore Logo"
                  width={40}
                  height={40}
                  priority
                  className="object-contain"
                />
              </div>
              <div>
                <span className={`${headingFont.className} text-xl font-bold tracking-tight text-white flex items-center gap-1.5`}>
                  NaySha <span className="text-cyan-400 font-extrabold">EduCore</span>
                </span>
                <p className="text-[11px] font-medium text-slate-400 tracking-wide uppercase">
                  Modern School Operations Platform
                </p>
              </div>

              {/* Supporting subtle status pill */}
              <div className="ml-auto hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] font-medium text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Enterprise Cloud • 99.9% Uptime
              </div>
            </div>

            {/* Hero Copy */}
            <div className="mt-12 xl:mt-16 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-cyan-300 mb-4">
                <span>Secure • Easy to Use • Built for Schools</span>
              </div>

              <h1 className={`${headingFont.className} text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.15]`}>
                Everything your school needs,{" "}
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
                  in one place.
                </span>
              </h1>

              <p className="mt-5 text-base xl:text-lg leading-relaxed text-slate-300 font-normal">
                Manage attendance, fees, exams, report cards and parent communication with a simple, powerful and secure platform.
              </p>
            </div>

            {/* 4 Feature Highlights */}
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-xl">
              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-white">Attendance</h4>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-tight">Fast, accurate and paperless daily roll calls</p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  </div>
                  <h4 className="text-xs font-semibold text-white">Fees & Receipts</h4>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-tight">Simple and transparent fee management</p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10" /><path d="M6 10h10" /></svg>
                  </div>
                  <h4 className="text-xs font-semibold text-white">Exams & Results</h4>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-tight">From marks entry to bulk PDF report cards</p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/5 bg-slate-900/40 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                  <h4 className="text-xs font-semibold text-white">Parent Communication</h4>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 leading-tight">Keep parents informed and connected</p>
              </div>
            </div>
          </div>

          {/* Product Dashboard Visual Showcase */}
          <div className="my-8 relative">
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-[#09152b]/95 to-[#050e1f]/95 p-4 shadow-[0_20px_50px_rgba(2,8,23,0.7),0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-md">
              {/* Mock Dashboard Topbar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-[11px] font-medium text-slate-400">NaySha EduCore Console</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/20">
                    Live Session
                  </span>
                </div>
              </div>

              {/* Mock Dashboard Metrics */}
              <div className="grid grid-cols-4 gap-2.5 mt-3">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Total Enrolled</span>
                  <span className={`${headingFont.className} text-base font-bold text-white`}>681 Students</span>
                  <span className="text-[9px] text-emerald-400 block mt-0.5">21 Classes Active</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Today Attendance</span>
                  <span className={`${headingFont.className} text-base font-bold text-cyan-300`}>98.2%</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">All Roll Calls Done</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Fee Counter</span>
                  <span className={`${headingFont.className} text-base font-bold text-emerald-300`}>₹34,500</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">28 Receipts Today</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 block">Examinations</span>
                  <span className={`${headingFont.className} text-base font-bold text-amber-300`}>Term 1</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">55 Subjects Graded</span>
                </div>
              </div>

              {/* Sample Activity Roster Table */}
              <div className="mt-3 rounded-lg border border-white/5 bg-[#030917]/80 p-2.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-white/5 text-[10px] font-semibold uppercase tracking-wider">
                  <span>Class Cohort</span>
                  <span>Attendance Status</span>
                  <span>Fee Ledger</span>
                  <span>Action</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-white/[0.03]">
                  <span className="font-semibold text-slate-200">Class 10-A (33 Students)</span>
                  <span className="text-emerald-400 font-medium">32 Present • 1 Absent</span>
                  <span className="text-slate-300">₹42,000 Collected</span>
                  <span className="text-cyan-400 hover:underline">View Roster</span>
                </div>
                <div className="flex items-center justify-between pt-1.5">
                  <span className="font-semibold text-slate-200">Class 1-B (42 Students)</span>
                  <span className="text-emerald-400 font-medium">41 Present • 1 Absent</span>
                  <span className="text-slate-300">₹50,400 Collected</span>
                  <span className="text-cyan-400 hover:underline">View Roster</span>
                </div>
              </div>
            </div>

            {/* Small floating mobile preview badge */}
            <div className="absolute -bottom-3.5 -right-3 hidden xl:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/40 shadow-[0_8px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-semibold text-cyan-200">
                Parent Portal Active • Live Roll Call Verified
              </span>
            </div>
          </div>

          {/* Bottom Left Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-400">Powered by</span>
              <span className={`${headingFont.className} font-bold tracking-wider text-slate-300 uppercase text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10`}>
                Groenics
              </span>
            </div>
            <span>© 2026 NaySha Technologies. All rights reserved.</span>
          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT SIDE: Premium Glass Login Card (42% width on desktop)
            ════════════════════════════════════════════════════════════════ */}
        <div className="col-span-12 lg:col-span-5 flex flex-col justify-center items-center p-4 sm:p-8 xl:p-12 relative z-10">
          
          {/* Mobile Top Brand Bar (Visible only on mobile/tablet) */}
          <div className="lg:hidden w-full max-w-md flex items-center justify-center gap-3 mb-6">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 p-1 border border-cyan-500/30 flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="NaySha EduCore Logo"
                width={36}
                height={36}
                priority
                className="object-contain"
              />
            </div>
            <div className="text-left">
              <span className={`${headingFont.className} text-lg font-bold text-white tracking-tight`}>
                NaySha <span className="text-cyan-400">EduCore</span>
              </span>
              <p className="text-[10px] text-slate-400">School ERP Platform</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#091322]/90 p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.55),0_0_30px_rgba(6,182,212,0.08)] backdrop-blur-xl">
            
            {/* Logo on Top of Card */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-[#0b1c36] to-[#061124] p-2 border border-cyan-400/30 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-center mb-4 transition-transform hover:scale-105 duration-300">
                <Image
                  src="/logo.png"
                  alt="NaySha EduCore Official Logo"
                  width={56}
                  height={56}
                  priority
                  className="object-contain"
                />
              </div>

              {/* Subdomain School Badge if tenant is detected */}
              {school?.name ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 mb-3 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {school.name}
                </div>
              ) : null}

              <h2 className={`${headingFont.className} text-2xl sm:text-3xl font-bold tracking-tight text-white`}>
                Welcome back
              </h2>
              <p className="mt-1.5 text-sm text-slate-300 font-medium">
                Sign in to your school account
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Use your registered email to continue.
              </p>
            </div>

            {/* Notification Banners */}
            {setupDone ? (
              <div className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-xs sm:text-sm text-emerald-100 flex items-start gap-2.5">
                <CheckCircleIcon className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Account setup completed. You can now sign in with your email and password.</span>
              </div>
            ) : null}

            {resetSent ? (
              <div className="mb-5 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-3 text-xs sm:text-sm text-cyan-100 flex items-start gap-2.5">
                <CheckCircleIcon className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <span>Password reset email sent. Please check your inbox for instructions.</span>
              </div>
            ) : null}

            {/* Authentication Form States */}
            <div className="space-y-4">
              
              {/* STEP 1: Email Identification */}
              {!resolvedAccount ? (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <MailIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !loading) {
                            identifyAccount()
                          }
                        }}
                        placeholder="name@school.com"
                        autoComplete="email"
                        className="w-full rounded-xl border border-slate-700/60 bg-[#06101f] pl-10 pr-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={identifyAccount}
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-cyan-500 px-4 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(6,182,212,0.25)] transition-all hover:from-blue-500 hover:to-cyan-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Checking Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              ) : resolvedAccount.loginMethod === "password" ? (
                /* STEP 2A: Password Flow (Admin / Staff) */
                <>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs sm:text-sm text-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold capitalize">{roleLabel} Account</span>
                      <p className="text-xs text-emerald-200/80 truncate max-w-[220px]">{resolvedAccount.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={backToEmailStep}
                      className="text-xs text-emerald-300 underline hover:text-emerald-100"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <LockIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !loading) {
                            loginWithPassword()
                          }
                        }}
                        placeholder="••••••••••••"
                        autoFocus
                        className="w-full rounded-xl border border-slate-700/60 bg-[#06101f] pl-10 pr-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={backToEmailStep}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={loginWithPassword}
                      disabled={loading}
                      className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(6,182,212,0.25)] hover:from-blue-500 hover:to-cyan-400 transition disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {loading ? "Signing In..." : "Sign In"}
                    </button>
                  </div>
                </>
              ) : resolvedAccount.role === "teacher" ? (
                /* STEP 2B: Teacher Setup OTP */
                <>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs sm:text-sm text-emerald-100">
                    <p className="font-semibold">First-time Teacher Setup</p>
                    <p className="mt-1 text-emerald-200/80 text-xs">
                      A verification code will be sent to <span className="font-medium text-white">{resolvedAccount.email}</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={backToEmailStep}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={sendTeacherSetupOtp}
                      disabled={loading}
                      className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {loading ? "Sending..." : "Send Code"}
                    </button>
                  </div>
                </>
              ) : (
                /* STEP 2C: Parent OTP Flow */
                <>
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-xs sm:text-sm text-amber-100">
                    <p className="font-semibold">Parent Portal Access</p>
                    <p className="mt-1 text-amber-200/80 text-xs">
                      Parent account identified for <span className="font-medium text-white">{resolvedAccount.email}</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={backToEmailStep}
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={sendParentOtp}
                      disabled={loading}
                      className="rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      {loading ? "Sending..." : "Send OTP"}
                    </button>
                  </div>
                </>
              )}

              {/* Secondary Navigation Actions: Setup Account & Reset Password */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setHelperMode(helperMode === "setup" ? "none" : "setup")}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition flex items-center justify-center gap-2 ${
                    helperMode === "setup"
                      ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                      : "border-slate-800 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:border-slate-700"
                  }`}
                >
                  <UserPlusIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Setup Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHelperMode(helperMode === "reset" ? "none" : "reset")}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition flex items-center justify-center gap-2 ${
                    helperMode === "reset"
                      ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
                      : "border-slate-800 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:border-slate-700"
                  }`}
                >
                  <KeyRoundIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reset Password</span>
                </button>
              </div>

            </div>

            {/* Helper Drawer: Setup Account */}
            {helperMode === "setup" ? (
              <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 animate-in fade-in duration-200">
                <p className="text-xs font-bold text-white uppercase tracking-wider">First-Time Account Setup</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-200/90">
                  Verify your existing registered school email to set your initial password.
                </p>
                <div className="mt-3 space-y-2.5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MailIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={setupEmail}
                      onChange={(event) => setSetupEmail(event.target.value)}
                      placeholder="Enter registered school email"
                      className="w-full rounded-xl border border-amber-300/30 bg-[#06101f] pl-9 pr-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-amber-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={startExistingAccountSetup}
                    disabled={setupLoading}
                    className="w-full rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-70 flex items-center justify-center gap-1.5"
                  >
                    {setupLoading ? "Verifying..." : "Send Verification OTP"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Helper Drawer: Reset Password */}
            {helperMode === "reset" ? (
              <div className="mt-4 rounded-xl border border-cyan-400/25 bg-cyan-400/10 p-4 animate-in fade-in duration-200">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Reset Password</p>
                <p className="mt-1 text-xs leading-relaxed text-cyan-200/90">
                  Request a secure password reset link for administrator and teacher accounts.
                </p>
                <div className="mt-3 space-y-2.5">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <MailIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="Enter account email"
                      className="w-full rounded-xl border border-cyan-300/30 bg-[#06101f] pl-9 pr-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={requestPasswordReset}
                    disabled={resetLoading}
                    className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-70 flex items-center justify-center gap-1.5"
                  >
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Security and Privacy Reassurance Footer on Login Card */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-center text-slate-400">
              <ShieldCheckIcon className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-[11px] leading-tight">
                <span className="font-semibold text-slate-300">Your data is secure and private.</span>
                <span className="block text-[10px] text-slate-400">Protected with industry-standard security.</span>
              </div>
            </div>

          </div>

          {/* Mobile Footer Credit (Visible only on mobile/tablet) */}
          <div className="lg:hidden mt-6 text-center text-xs text-slate-500">
            <span>Powered by <strong className="text-slate-400 font-semibold">Groenics</strong></span>
            <span className="block text-[10px] text-slate-600 mt-1">© 2026 NaySha Technologies</span>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060b13] flex items-center justify-center text-slate-400 text-sm">
          Loading login portal...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

