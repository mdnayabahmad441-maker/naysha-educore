"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { getUserRole } from "@/lib/getUserRole"
import { useSchool } from "@/context/SchoolContext"
import { getCurrentTeacher } from "@/lib/role-access"

// ── Icons ──────────────────────────────────────────────────────────────────────
function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  home:       "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  students:   "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  attendance: "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  myAttend:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z M16 3.13a4 4 0 010 7.75",
  exams:      "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  marks:      "M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
  paper:      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  logout:     "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
}

// ── Nav config ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: "/teacher",             label: "Dashboard",        icon: "home",       exact: true },
  { href: "/teacher/students",    label: "My Students",      icon: "students" },
  { href: "/teacher/attendance",  label: "Student Attendance", icon: "attendance" },
  { href: "/teacher/my-attendance", label: "My Attendance",  icon: "myAttend" },
  { href: "/teacher/exams",       label: "Exams",            icon: "exams" },
  { href: "/teacher/marks",       label: "Enter Marks",      icon: "marks" },
  { href: "/teacher/question-paper", label: "Question Paper", icon: "paper" },
]

const BOTTOM_NAV = [
  { href: "/teacher",               label: "Home",       icon: "home",       exact: true },
  { href: "/teacher/attendance",    label: "Attendance", icon: "attendance" },
  { href: "/teacher/students",      label: "Students",   icon: "students" },
  { href: "/teacher/marks",         label: "Marks",      icon: "marks" },
  { href: "/teacher/question-paper", label: "Papers",    icon: "paper" },
]

// ── Component ──────────────────────────────────────────────────────────────────
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const school   = useSchool()

  const [loading,     setLoading]     = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [teacherName, setTeacherName] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await waitForSession()
        if (!session) { window.location.href = "/login"; return }

        let roleData = null
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, 600))
          roleData = await getUserRole()
          if (roleData?.role === "teacher") break
        }
        if (roleData?.role !== "teacher") { window.location.href = "/unauthorized"; return }

        const teacher = await getCurrentTeacher()
        if (teacher?.name) setTeacherName(teacher.name)
        setLoading(false)
      } catch {
        window.location.href = "/login"
      }
    }

    checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") window.location.href = "/login"
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut({ scope: "local" })
    window.location.href = "/login"
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const initials = teacherName
    .split(" ")
    .slice(0, 2)
    .map(w => w[0])
    .join("")
    .toUpperCase()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-main)">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-(--bg-main) text-(--text-main)">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-(--border) bg-(--bg-card) transition-transform duration-250 md:static md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

        {/* School name */}
        <div className="flex items-center justify-between px-5 py-5">
          <span className="text-base font-bold text-white truncate">{school?.name || "Teacher Panel"}</span>
          <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-(--text-muted) hover:bg-white/5 md:hidden">
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Teacher pill */}
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-(--primary) to-(--primary-2) text-xs font-bold text-white">
            {initials || "T"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{teacherName || "Teacher"}</p>
            <p className="text-[11px] text-(--text-muted)">Teacher</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "nav-link-active"
                    : "text-(--text-muted) hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon d={ICONS[item.icon as keyof typeof ICONS]} size={17} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-400/10"
          >
            <Icon d={ICONS.logout} size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex min-h-0 flex-1 flex-col">

        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-(--border) bg-(--bg-card) px-4 md:px-6">
          {/* Mobile: menu button + school name */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-(--border) p-2 text-(--text-muted) hover:bg-white/5"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            <span className="text-sm font-semibold text-white truncate">{school?.name || "Teacher Panel"}</span>
          </div>

          {/* Desktop: greeting */}
          <p className="hidden text-sm text-(--text-muted) md:block">
            Welcome back, <span className="font-semibold text-white">{teacherName}</span>
          </p>

          {/* Desktop: avatar + sign out */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-(--primary) to-(--primary-2) text-xs font-bold text-white">
              {initials || "T"}
            </div>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm text-red-400 hover:bg-red-400/10 transition"
            >
              Sign Out
            </button>
          </div>

          {/* Mobile: avatar */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-(--primary) to-(--primary-2) text-xs font-bold text-white md:hidden">
            {initials || "T"}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-2xl border border-(--border) bg-(--bg-card) px-2 py-2 shadow-xl md:hidden">
          {BOTTOM_NAV.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-medium transition ${
                  active ? "text-white bg-white/10" : "text-(--text-muted) hover:text-white"
                }`}
              >
                <Icon d={ICONS[item.icon as keyof typeof ICONS]} size={19} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
