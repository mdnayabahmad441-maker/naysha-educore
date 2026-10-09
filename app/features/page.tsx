import Link from "next/link"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"

export const metadata = {
  title: "School ERP Features & Modules — NaySha EduCore",
  description:
    "Explore the complete feature suite of NaySha EduCore: GPS teacher attendance, automated fee collection, report cards, WhatsApp alerts, and AI-powered question papers.",
  alternates: {
    canonical: "https://www.naysha.online/features",
  },
}

export default function FeaturesPage() {
  const modules = [
    {
      icon: "📍",
      title: "GPS-Verified Teacher Attendance",
      badge: "Anti-Proxy Verification",
      description:
        "Ensure punctual, accountable staff operations with GPS geofencing. Teachers check in and out from their mobile devices only when physically inside the authorized school radius.",
      points: [
        "School-specific GPS coordinates with configurable meter radius",
        "Anti-proxy tamper-proofing prevents remote attendance submission",
        "Monthly attendance summaries, leave tracking, and working day reports",
        "Direct admin overview of staff check-in times and presence",
      ],
    },
    {
      icon: "💳",
      title: "Fee Management & Digital Receipts",
      badge: "Zero Fee Leakage",
      description:
        "Replace paper receipt books with automated fee tracking, customizable fee heads, installment management, and instant printable PDF receipts.",
      points: [
        "Tuition, transport, hostel, and miscellaneous fee heads",
        "Automated installment schedules with real-time dues calculation",
        "Branded, printable PDF receipts with unique receipt numbers",
        "Complete payment history and financial ledger for accountants",
      ],
    },
    {
      icon: "💬",
      title: "Meta WhatsApp Cloud Communication",
      badge: "98% Open Rate",
      description:
        "Deliver school notices, fee reminders, admission receipts, and emergency announcements directly into parents' personal WhatsApp inboxes.",
      points: [
        "Official Meta WhatsApp Cloud API integration for reliable delivery",
        "Instant admission enquiry notifications to school administrators",
        "One-click school notices broadcasted to parents and teachers",
        "Dramatically outperforms traditional SMS gateways in speed and cost",
      ],
    },
    {
      icon: "📊",
      title: "Exams, Marks & Digital Report Cards",
      badge: "Automated Grading",
      description:
        "Manage term examinations, multiple subjects, and grade distributions with rapid marks entry and instant report card generation.",
      points: [
        "Term exam scheduling with subject-wise maximum & passing marks",
        "Fast numerical marks entry interface for classroom teachers",
        "Automatic percentage and grade calculations based on school rules",
        "Downloadable and printable student report cards ready for distribution",
      ],
    },
    {
      icon: "🤖",
      title: "AI Question Paper & Classroom Generator",
      badge: "Anthropic Claude Powered",
      description:
        "Empower your teachers with integrated artificial intelligence. Generate balanced question papers, quizzes, and classroom exercises in seconds.",
      points: [
        "Create subject-specific questions across difficulty levels",
        "Multiple-choice, short-answer, and essay-type question generation",
        "Formatted document layout ready for classroom distribution",
        "Saves teachers hours of manual typing and test preparation",
      ],
    },
    {
      icon: "👥",
      title: "Student Information System (SIS)",
      badge: "Complete Records",
      description:
        "Maintain comprehensive academic and personal records for every student from enrollment through graduation.",
      points: [
        "Student enrollment with auto-generated unique student codes",
        "Class, section, and roll number assignment with bulk promotion",
        "Parent and guardian contact details and relationship tracking",
        "Branded printable student ID cards with photos and emergency contacts",
      ],
    },
    {
      icon: "📱",
      title: "Dedicated Role Portals & Mobile App",
      badge: "Web + Android",
      description:
        "Tailored workspaces for School Admins, Teachers, Parents, and Super Admins, accessible via web browser and the native Android app.",
      points: [
        "Admin Portal: Full institutional control and financial oversight",
        "Teacher Portal: Class attendance, marks entry, and daily homework",
        "Parent Portal: Attendance history, fee dues, report cards, and notices",
        "Capacitor Android app for on-the-go school operations",
      ],
    },
    {
      icon: "📁",
      title: "Bulk Import & Excel Migration",
      badge: "Rapid Onboarding",
      description:
        "Migrate an entire school with hundreds of students in minutes using CSV/Excel import tools.",
      points: [
        "One-click CSV upload for students, teachers, and subjects",
        "Data validation before insertion to prevent formatting errors",
        "Free migration assistance provided by the NaySha onboarding team",
        "Zero downtime transition from manual registers or legacy ERPs",
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <MarketingNav />

      <main className="flex-1">
        {/* Header Section */}
        <section className="py-16 lg:py-24 border-b border-slate-800/80 bg-gradient-to-b from-[#07111f] via-[#0a1628] to-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Platform Modules & Architecture
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
              Engineered to Solve Real Day-to-Day School Challenges
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Every module in NaySha EduCore was built to address the operational bottlenecks faced by school principals, administrators, teachers, and parents.
            </p>
          </div>
        </section>

        {/* Modules List */}
        <section className="py-16 lg:py-24 bg-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {modules.map((mod) => (
                <div
                  key={mod.title}
                  className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl">{mod.icon}</span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {mod.badge}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">{mod.title}</h2>
                    <p className="text-sm text-slate-300 leading-relaxed mb-6">
                      {mod.description}
                    </p>
                    <ul className="space-y-2.5 border-t border-slate-800/80 pt-4">
                      {mod.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-xs text-slate-400">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom CTA Banner */}
            <div className="mt-16 p-8 lg:p-12 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/60 border border-blue-500/30 text-center max-w-4xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-bold text-white">
                Ready to Experience These Features Live?
              </h3>
              <p className="mt-3 text-sm text-slate-300 max-w-xl mx-auto">
                Schedule a customized live demo with our school specialists. We will show you how these modules fit your school&apos;s daily workflow.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/book-demo"
                  className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg transition"
                >
                  Request School Walkthrough
                </Link>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-slate-200 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition"
                >
                  View Pricing
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

