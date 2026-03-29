"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const MENU = [
  { href: "/admin/dashboard", icon: "⊞", label: "Dashboard", section: null },
  { href: null, icon: null, label: "ACADEMICS", section: true },
  { href: "/admin/students", icon: "🎓", label: "Students", section: false },
  { href: "/admin/teachers", icon: "👩‍🏫", label: "Teachers", section: false },
  { href: "/admin/classes", icon: "🏫", label: "Classes", section: false },
  { href: "/admin/subjects", icon: "📚", label: "Subjects", section: false },
  { href: null, icon: null, label: "ATTENDANCE", section: true },
  { href: "/admin/attendance", icon: "✅", label: "Attendance", section: false },
  { href: null, icon: null, label: "EXAMINATIONS", section: true },
  { href: "/admin/exams", icon: "📝", label: "Create Exam", section: false },
  { href: "/admin/exams/marks", icon: "✏️", label: "Marks Entry", section: false },
  { href: "/admin/exams/results", icon: "📊", label: "Results", section: false },
  { href: "/admin/report-cards", icon: "🗂️", label: "Report Cards", section: false },
  { href: null, icon: null, label: "FINANCE", section: true },
  { href: "/admin/fees", icon: "💰", label: "Fees", section: false },
  { href: "/admin/payments", icon: "💳", label: "Payments", section: false },
  { href: "/admin/reports", icon: "📈", label: "Reports", section: false },
  { href: null, icon: null, label: "COMMUNICATION", section: true },
  { href: "/admin/notices", icon: "📢", label: "Notices", section: false },
  { href: null, icon: null, label: "SYSTEM", section: true },
  { href: "/admin/settings", icon: "⚙️", label: "Settings", section: false },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside style={{
      width: collapsed ? 60 : 240,
      minWidth: collapsed ? 60 : 240,
      background: "#0d1826",
      borderRight: "1px solid #1a3050",
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      transition: "width 0.25s",
      overflow: "hidden",
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{
        padding: "18px 16px",
        borderBottom: "1px solid #1a3050",
        display: "flex",
        alignItems: "center",
        gap: 10,
        minHeight: 64,
      }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>🏫</span>
        {!collapsed && (
          <div>
            <div style={{
              fontWeight: 800, fontSize: 14,
              color: "#00c2ff", whiteSpace: "nowrap",
              fontFamily: "Georgia, serif",
            }}>NaySha EduCore</div>
            <div style={{ color: "#2a4a6a", fontSize: 10 }}>School ERP</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1,
        padding: "10px 8px",
        overflowY: "auto",
        overflowX: "hidden",
      }}>
        {MENU.map((item, i) => {

          // Section header
          if (item.section) {
            return !collapsed ? (
              <div key={i} style={{
                color: "#2a4a6a",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.5,
                padding: "14px 10px 4px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}>{item.label}</div>
            ) : <div key={i} style={{ height: 8 }} />
          }

          // Dashboard (no section)
          const isActive = pathname === item.href ||
            (item.href !== "/admin/dashboard" && pathname.startsWith(item.href!))

          return (
            <Link key={i} href={item.href!} style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 10px",
              borderRadius: 9,
              marginBottom: 2,
              background: isActive ? "#0d2540" : "transparent",
              color: isActive ? "#00c2ff" : "#6b8cad",
              fontWeight: isActive ? 700 : 500,
              fontSize: 13,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "all 0.15s",
              borderLeft: isActive ? "3px solid #00c2ff" : "3px solid transparent",
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      {!collapsed && (
        <button onClick={handleLogout} style={{
          margin: "8px 12px",
          background: "transparent",
          border: "1px solid #1a3050",
          borderRadius: 8,
          color: "#6b8cad",
          padding: "9px",
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "inherit",
        }}>
          🚪 Logout
        </button>
      )}

      {/* Collapse toggle */}
      <button onClick={() => setCollapsed(!collapsed)} style={{
        background: "transparent",
        border: "none",
        borderTop: "1px solid #1a3050",
        color: "#2a4a6a",
        padding: "12px",
        cursor: "pointer",
        fontSize: 14,
        textAlign: "center",
      }}>
        {collapsed ? "▶" : "◀"}
      </button>

    </aside>
  )
}