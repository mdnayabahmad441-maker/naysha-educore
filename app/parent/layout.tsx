"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ParentLayout({ children }: { children: React.ReactNode }) {

  const pathname = usePathname()

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition ${
      pathname.startsWith(path)
        ? "bg-white/20 text-white"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`

  return (

    <div className="flex min-h-screen bg-[#020c1b] text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0b1a33] border-r border-white/10 p-6">

        <h1 className="text-xl font-bold mb-8">
          Parent Panel
        </h1>

        <nav className="flex flex-col gap-2 text-sm">

          <Link href="/parent" className={linkStyle("/parent")}>
            🏠 Dashboard
          </Link>

          <Link href="/parent/attendance" className={linkStyle("/parent/attendance")}>
            📅 Attendance
          </Link>

          <Link href="/parent/fees" className={linkStyle("/parent/fees")}>
            💰 Fees
          </Link>

          <Link href="/parent/results" className={linkStyle("/parent/results")}>
            📄 Results
          </Link>

        </nav>

      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="flex justify-between items-center px-8 py-4 bg-[#0b1a33] border-b border-white/10">

          <h2 className="text-lg font-semibold">
            Parent Dashboard
          </h2>

          <button
            onClick={logout}
            className="bg-white/10 px-4 py-2 rounded"
          >
            Logout
          </button>

        </header>

        <main className="flex-1 p-6 md:p-10">
          {children}
        </main>

      </div>

    </div>
  )
}