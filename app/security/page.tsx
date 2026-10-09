import Link from "next/link"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"

export const metadata = {
  title: "Platform Security & Architecture — NaySha EduCore",
  description:
    "Learn about the security safeguards, multi-tenant isolation, database row-level security (RLS), and rate limiting implemented across NaySha EduCore.",
  alternates: {
    canonical: "https://naysha.online/security",
  },
}

export default function SecurityPage() {
  const controls = [
    {
      title: "Multi-Tenant Isolation & PostgreSQL RLS",
      icon: "🔒",
      badge: "Database Level",
      description:
        "Every school's data is strictly partitioned. PostgreSQL Row-Level Security (RLS) policies enforce school-level isolation across students, teachers, fees, and exam tables, preventing unauthorized cross-tenant data access.",
    },
    {
      title: "Resilient Distributed Rate Limiting",
      icon: "🛡️",
      badge: "API Defense",
      description:
        "Public endpoints and admission enquiry APIs are protected by distributed sliding-window rate limiters backed by Upstash Redis with bounded 1,500ms AbortSignal timeouts and bounded in-memory fallbacks.",
    },
    {
      title: "Role-Based Access Control (RBAC)",
      icon: "👥",
      badge: "Identity & Access",
      description:
        "Separate authorization boundaries for School Administrators, Teachers, Parents, and Super Admins. Server-side session verification strictly validates user roles before executing any administrative query or mutation.",
    },
    {
      title: "Database Error Sanitization",
      icon: "🧼",
      badge: "Data Privacy",
      description:
        "Raw PostgreSQL exceptions, schema definitions, table names, and constraint keys are stripped and sanitized server-side before returning user-friendly messages to the client.",
    },
    {
      title: "Canonical Phone Number Verification",
      icon: "📱",
      badge: "Abuse Prevention",
      description:
        "Indian mobile numbers submitted via public forms undergo canonical 10-digit normalization, preventing rate-limiting evasion and blocking automated spam from triggering unwanted WhatsApp notifications.",
    },
    {
      title: "Encrypted Transport & Strict Security Headers",
      icon: "🌐",
      badge: "Transport Security",
      description:
        "Enforced HTTPS/TLS with HTTP Strict Transport Security (HSTS), X-Frame-Options (DENY to prevent clickjacking), X-Content-Type-Options (nosniff), and restrictive Content Security Policies (CSP).",
    },
    {
      title: "Location Privacy for Attendance",
      icon: "📍",
      badge: "Privacy Focused",
      description:
        "Device GPS coordinates are accessed only on-demand when a teacher initiates attendance check-in or check-out. NaySha EduCore does not run background location tracking or sell user data.",
    },
    {
      title: "Continuous Audits & Hardening",
      icon: "🔍",
      badge: "Engineering Rigor",
      description:
        "The codebase undergoes structured technical audits and vulnerability remediations to maintain high uptime, resilient API performance, and data integrity for operating schools.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 lg:py-24 border-b border-slate-800/80 bg-gradient-to-b from-[#07111f] via-[#091526] to-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Trust & Data Protection
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
              Engineered with Enterprise-Grade Security Controls
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              We treat student privacy, parent records, and school financial data with the highest technical rigor. Here is an overview of the controls implemented across NaySha EduCore.
            </p>
          </div>
        </section>

        {/* Security Controls Grid */}
        <section className="py-16 lg:py-24 bg-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {controls.map((item) => (
                <div
                  key={item.title}
                  className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl">{item.icon}</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.badge}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{item.title}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Compliance & Vulnerability Reporting */}
            <div className="mt-16 p-8 lg:p-10 rounded-3xl bg-slate-900/70 border border-slate-800 max-w-4xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-2">Responsible Disclosure & Support</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                If you have questions regarding our security architecture, data handling procedures, or wish to report a security vulnerability responsibly, please contact our engineering security lead at{" "}
                <a href="mailto:support@naysha.online" className="text-blue-400 hover:underline font-semibold">
                  support@naysha.online
                </a>.
              </p>
              <div className="mt-6 flex gap-4">
                <Link
                  href="/privacy"
                  className="text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Read Privacy Policy →
                </Link>
                <Link
                  href="/terms"
                  className="text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Read Terms of Service →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

