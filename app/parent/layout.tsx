"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { useEffect, useState } from "react"
import { getCurrentParentStudentIds } from "@/lib/role-access"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const session = await waitForSession()

      if (!session) {
        window.location.href = "/login"
        return
      }

      let studentIds: string[] = []

     
      for (let attempt = 0; attempt < 5; attempt++) {
        if (attempt > 0) await wait(500)

        try {
          studentIds = await getCurrentParentStudentIds()
          console.log("Parent access check:", studentIds)

          if (studentIds.length > 0) break
        } catch (e) {
          console.warn("Parent check error:", e)
        }

        await supabase.auth.refreshSession()
      }

      
      if (studentIds.length === 0) {
        console.warn("No student linked to parent")
        window.location.href = "/unauthorized"
        return
      }

      setLoading(false)
    }

    void checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        window.location.href = "/login"
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut({ scope: "local" })
    window.location.href = "/login"
  }

  const navItems = [
    { href: "/parent", label: "Dashboard" },
    { href: "/parent/attendance", label: "Attendance" },
    { href: "/parent/fees", label: "Fees" },
    { href: "/parent/results", label: "Results" },
    { href: "/parent/homework", label: "Homework" },
  ]

  const linkStyle = (path: string) =>
    `flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
      pathname.startsWith(path)
        ? "bg-white/20 text-white"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-main) text-(--text-main)">
        Loading...
      </div>
    )
  }

  return (
    <div className="theme-dashboard flex h-screen min-w-0 flex-col overflow-hidden bg-(--bg-main) text-(--text-main) md:flex-row">
      <aside className="hidden w-64 shrink-0 bg-(--bg-card) p-6 md:block">
        <h1 className="mb-6 text-xl font-bold">Parent Panel</h1>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={linkStyle(item.href)}>{item.label}</Link>
          ))}
        </nav>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-lg bg-red-500 px-4 py-2"
        >
          Sign Out
        </button>

        <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-400">
          <p>NaySha EduCore</p>
          <p className="mt-1">Powered by <span className="font-semibold text-white/80">Groenics</span></p>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="shrink-0 border-b border-(--border) bg-(--bg-card) px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="min-w-0 truncate text-lg font-semibold">Parent Dashboard</h2>
            <button
              onClick={logout}
              className="shrink-0 rounded-lg bg-red-500 px-3 py-2 text-sm md:hidden"
            >
              Sign Out
            </button>
          </div>
          <nav className="-mx-1 mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-2 text-sm ${
                  pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-gray-300"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="mt-3 text-xs text-slate-400 md:hidden">
            Powered by <span className="font-semibold text-white/80">Groenics</span>
          </p>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
