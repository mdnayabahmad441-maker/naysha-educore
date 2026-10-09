import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import BookDemoForm from "@/components/marketing/BookDemoForm"

export const metadata = {
  title: "Book a Free School Demo — NaySha EduCore",
  description:
    "Schedule a live personalized demonstration of NaySha EduCore School ERP. Experience GPS attendance, automated fee receipts, report cards, and WhatsApp parent alerts.",
  alternates: {
    canonical: "https://naysha.online/book-demo",
  },
}

export default function BookDemoPage() {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 lg:py-20 border-b border-slate-800/80 bg-gradient-to-b from-[#07111f] via-[#091526] to-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Personalized School Demonstration
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
              See How NaySha EduCore Transforms Your School
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Join school principals and administrators across India who have eliminated manual paperwork, fee leakage, and administrative chaos.
            </p>
          </div>
        </section>

        {/* Demo Booking Section */}
        <section className="py-16 lg:py-24 bg-[#07111f]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left Column: What you will see */}
              <div className="lg:col-span-5 space-y-6">
                <h2 className="text-2xl font-bold text-white">What You&apos;ll Experience in the Demo:</h2>
                
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>📍</span> GPS Attendance in Action
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Watch how staff check-in is verified against school boundary coordinates, preventing proxy attendance completely.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>💳</span> 1-Click Fee Receipts
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      See how fast fees are recorded, installments tracked, and branded PDF receipts generated with zero calculation errors.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>💬</span> WhatsApp Cloud Messaging
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Experience instant school alerts and notices delivered straight to parents&apos; personal WhatsApp numbers with 98% open rates.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <span>📁</span> Excel Migration Plan
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      Learn how we migrate your existing student list, classes, and sections with zero manual retyping.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs text-slate-400 space-y-1">
                  <p>✓ 100% Free Consultation</p>
                  <p>✓ No Credit Card or Obligation</p>
                  <p>✓ Customized to Your School Size</p>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="lg:col-span-7 p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-1">Schedule Your Live Walkthrough</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Please provide your school details. Our team will contact you to coordinate a convenient time.
                </p>
                <BookDemoForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}

