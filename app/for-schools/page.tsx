import Link from "next/link"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"

export const metadata = {
  title: "Solutions for Schools — NaySha EduCore",
  description:
    "Tailored school ERP solutions for School Owners, Principals, Teachers, Accountants, and Parents. Enhance operational efficiency and eliminate administrative bottlenecks.",
  alternates: {
    canonical: "https://naysha.online/for-schools",
  },
}

export default function ForSchoolsPage() {
  const personas = [
    {
      role: "School Owners & Trustees",
      tagline: "Financial Oversight & Institutional Control",
      icon: "🏛️",
      benefits: [
        "Eliminate fee revenue leakage with computerized receipt numbers and tamper-proof ledgers.",
        "Real-time visibility into collection rates, outstanding dues, and cash/UPI reconciliation.",
        "Elevate institutional reputation with branded subdomains and modern parent communication.",
        "Scalable multi-tenant architecture designed to manage expanding branches effortlessly.",
      ],
    },
    {
      role: "Principals & Headmistresses",
      tagline: "Academic Discipline & Operational Smoothness",
      icon: "🎓",
      benefits: [
        "Enforce strict staff punctuality with anti-proxy GPS teacher check-ins.",
        "Instant whole-school notices delivered via WhatsApp in seconds.",
        "Comprehensive class and section analytics: attendance rates, pass percentages, and subject trends.",
        "Effortless student promotion, section reassignments, and academic year rollovers.",
      ],
    },
    {
      role: "Teachers & Academic Staff",
      tagline: "Less Administrative Paperwork, More Teaching",
      icon: "👩‍🏫",
      benefits: [
        "Take morning roll call in under 60 seconds with an intuitive mobile-friendly checklist.",
        "Fast numerical marks entry interface designed specifically for exam grading.",
        "Generate balanced, syllabus-aligned question papers using built-in Claude AI.",
        "Distribute daily homework and assignments with direct visibility to parents.",
      ],
    },
    {
      role: "School Accountants & Cashiers",
      tagline: "Flawless Fee Records & Rapid Receipts",
      icon: "💼",
      benefits: [
        "Instant generation of branded, printable PDF fee receipts for parents.",
        "Track partial installments, concessions, transport fees, and hostel dues with zero confusion.",
        "Complete payment history per student code; no missing paper counterfoils.",
        "Export clean records for annual auditing and financial reconciliation.",
      ],
    },
    {
      role: "Parents & Guardians",
      tagline: "Transparent Updates Direct to WhatsApp",
      icon: "👨‍👩‍👧",
      benefits: [
        "Immediate WhatsApp notification when their child is absent or when an important notice is posted.",
        "Instant digital fee receipts sent directly to their phone upon payment.",
        "Dedicated Parent Portal to view term exam results, report cards, and attendance trends.",
        "Direct connection to school events, exam schedules, and holiday announcements.",
      ],
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
              Role-Specific Solutions
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
              Empowering Every Stakeholder in Your School
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              A great school ERP cannot just serve administrators—it must simplify the daily routines of principals, teachers, accountants, and parents alike.
            </p>
          </div>
        </section>

        {/* Personas Section */}
        <section className="py-16 lg:py-24 bg-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            {personas.map((item, idx) => (
              <div
                key={item.role}
                className={`p-8 lg:p-10 rounded-3xl bg-slate-900/60 border border-slate-800/80 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center ${
                  idx % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                <div>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h2 className="text-2xl font-bold text-white">{item.role}</h2>
                  <p className="text-sm font-medium text-blue-400 mt-1">{item.tagline}</p>
                </div>

                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {item.benefits.map((benefit) => (
                      <div
                        key={benefit}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
                      >
                        <span className="text-emerald-400 font-bold text-sm">✓</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Bottom Call to Action */}
            <div className="pt-8 text-center max-w-xl mx-auto">
              <h3 className="text-xl font-bold text-white">Experience the Difference in 20 Minutes</h3>
              <p className="text-sm text-slate-400 mt-2">
                We will walk you through each role portal so you can see how teachers and admins interact with NaySha EduCore.
              </p>
              <div className="mt-6 flex justify-center gap-4">
                <Link
                  href="/book-demo"
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg transition"
                >
                  Schedule Role Walkthrough →
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

