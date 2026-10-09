import Link from "next/link"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"

export const metadata = {
  title: "School ERP Pricing — NaySha EduCore",
  description:
    "Transparent annual SaaS pricing for Indian schools at ₹180 per student/year. All core modules, updates, cloud hosting, and onboarding included. No hidden charges.",
  alternates: {
    canonical: "https://www.naysha.online/pricing",
  },
}

export default function PricingPage() {
  const featuresIncluded = [
    "Complete Student Information System (SIS)",
    "GPS-Verified Teacher & Staff Attendance",
    "Daily Student Attendance & Absentees Tracking",
    "Comprehensive Fee Management & Digital PDF Receipts",
    "Exams, Marks Entry & Downloadable Report Cards",
    "Meta WhatsApp Cloud API Integration for Notices & Alerts",
    "Anthropic Claude AI Question Paper Generator",
    "Dedicated Admin, Teacher, and Parent Web Portals",
    "Native Android App Access (Capacitor)",
    "School-Branded Subdomain (e.g. schoolname.naysha.online)",
    "PostgreSQL Row-Level Security & Multi-Tenant Isolation",
    "Free Excel/CSV Data Migration & Initial Setup",
    "Continuous Platform Security & Software Updates",
  ]

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 lg:py-24 border-b border-slate-800/80 bg-gradient-to-b from-[#07111f] via-[#091526] to-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Simple, Predictable Investment
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
              Straightforward Pricing Designed for Indian Schools
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              No module lockouts, no per-message hidden surcharges, and no surprise annual maintenance fees. One simple annual rate per enrolled student.
            </p>
          </div>
        </section>

        {/* Pricing Card Section */}
        <section className="py-16 lg:py-24 bg-[#07111f]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
              {/* Main SaaS Plan */}
              <div className="lg:col-span-2 p-8 lg:p-10 rounded-3xl bg-slate-900/80 border border-blue-500/30 shadow-2xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                        Annual Institutional License
                      </span>
                      <h2 className="text-2xl font-bold text-white mt-1">Full School ERP Suite</h2>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      Standard Contract
                    </span>
                  </div>

                  <div className="mt-6 flex items-baseline gap-2 pb-6 border-b border-slate-800">
                    <span className="text-5xl font-extrabold text-white">₹180</span>
                    <span className="text-slate-400 text-sm">/ student / year</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-2">
                    Verified commercial model proven in live school production (e.g. Jyoti Public School, ₹122,580 ACV for 681 students).
                  </p>

                  <h3 className="text-sm font-semibold text-slate-200 mt-8 mb-4 uppercase tracking-wider text-xs">
                    Everything Included With Zero Hidden Surcharges:
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                    {featuresIncluded.map((feat) => (
                      <div key={feat} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                  <Link
                    href="/book-demo"
                    className="w-full sm:w-auto px-8 py-3 text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition"
                  >
                    Schedule Demo & Onboarding
                  </Link>
                  <Link
                    href="/contact"
                    className="w-full sm:w-auto px-6 py-3 text-center text-sm font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition"
                  >
                    Speak with Sales
                  </Link>
                </div>
              </div>

              {/* Multi-Branch / Custom Institutional Quote */}
              <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                    Trusts & Chains
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">Multi-School Networks</h3>
                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    For educational societies, multi-branch school trusts, or institutions with over 1,500 students requiring centralized governance.
                  </p>

                  <ul className="mt-6 space-y-3 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Super Admin multi-school dashboard</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Consolidated society-level financial auditing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Custom subdomain or custom root domain mapping</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Dedicated technical account manager</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800">
                  <Link
                    href="/contact"
                    className="block w-full py-3 text-center text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition"
                  >
                    Request Custom Society Proposal →
                  </Link>
                </div>
              </div>
            </div>

            {/* Pricing Transparency Reassurance */}
            <div className="mt-12 p-6 rounded-2xl bg-blue-950/20 border border-blue-900/40 text-xs text-slate-300 leading-relaxed text-center max-w-3xl mx-auto">
              <strong className="text-blue-300">Commercial Transparency Guarantee:</strong> We do not charge separate server hosting charges, database maintenance fees, or annual update costs. Your annual per-student subscription covers the complete software, ongoing infrastructure, and customer support.
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

