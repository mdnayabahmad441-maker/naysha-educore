import Link from "next/link"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"

export const metadata = {
  title: "About NaySha EduCore & Groenics",
  description:
    "Learn about NaySha EduCore, the modern school ERP platform engineered by Groenics to modernize school administration, attendance, and parent communication across India.",
  alternates: {
    canonical: "https://www.naysha.online/about",
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 lg:py-24 border-b border-slate-800/80 bg-gradient-to-b from-[#07111f] via-[#091526] to-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Our Mission & Heritage
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
              Building Modern Digital Infrastructure for Indian Schools
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              NaySha EduCore is developed and operated by <strong>Groenics</strong> with a clear purpose: eliminating manual paperwork, fee leakage, and administrative chaos in educational institutions.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 lg:py-24 bg-[#07111f]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-16">
            {/* The Problem We Saw */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Why We Built NaySha EduCore</h2>
              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>
                  Most Indian private and regional schools still struggle with legacy desktop software, disconnected Excel spreadsheets, and physical paper registers. When schools attempted to adopt early software systems, they encountered slow, cumbersome user interfaces that teachers found difficult to use, alongside exorbitant setup fees and costly SMS gateway bills.
                </p>
                <p>
                  We designed NaySha EduCore from the ground up to solve these practical realities: an ERP that runs lightning-fast on budget smartphones, communicates over WhatsApp (which 100% of parents already have installed), verifies staff attendance using device GPS geofencing, and provides school principals with complete financial transparency.
                </p>
              </div>
            </div>

            {/* Core Architectural Pillars */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Our Engineering Principles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-2xl mb-2">⚡</div>
                  <h3 className="font-bold text-white text-base">Speed & Simplicity</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Designed for minimal clicks. Teachers can record attendance or enter marks in seconds without intensive technical training.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-2xl mb-2">🔒</div>
                  <h3 className="font-bold text-white text-base">Strict Tenant Isolation</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Every school operates in an isolated environment enforced by PostgreSQL Row-Level Security (RLS). School records remain strictly confidential.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-2xl mb-2">📲</div>
                  <h3 className="font-bold text-white text-base">WhatsApp-First Engagement</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Integrated directly with the Meta WhatsApp Cloud API so parents receive attendance alerts, notices, and fee receipts without downloading complex secondary portals.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="text-2xl mb-2">🤝</div>
                  <h3 className="font-bold text-white text-base">Hands-On School Partnership</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    We treat every school as a long-term partner, handling data migration from existing files, conducting staff training, and maintaining high platform reliability.
                  </p>
                </div>
              </div>
            </div>

            {/* Production Milestone */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Verified Customer Story
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                Jyoti Public School (Barsoi, Bihar)
              </h3>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Operating with 681 students, 21 classes, and 18 faculty members, Jyoti Public School transitioned from manual operations to NaySha EduCore. Today, all daily attendance, fee collections, exam marks, and WhatsApp notices run reliably through the platform on their dedicated subdomain (`jpsbarsoi.naysha.online`).
              </p>
            </div>

            {/* Bottom Contact / CTA */}
            <div className="pt-8 border-t border-slate-800 text-center space-y-4">
              <h3 className="text-xl font-bold text-white">Join the Future of School Administration</h3>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Discover how NaySha EduCore can streamline your institution. Reach out directly or book a personalized demo today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <Link
                  href="/book-demo"
                  className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg transition"
                >
                  Schedule Free Live Demo
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 transition"
                >
                  Contact Our Team
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

