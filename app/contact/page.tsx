import Link from "next/link"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import BookDemoForm from "@/components/marketing/BookDemoForm"

export const metadata = {
  title: "Contact NaySha EduCore Support & Sales",
  description:
    "Get in touch with the NaySha EduCore team at Groenics. Schedule a school demonstration, request technical assistance, or discuss enterprise onboarding.",
  alternates: {
    canonical: "https://naysha.online/contact",
  },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      <MarketingNav />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 lg:py-24 border-b border-slate-800/80 bg-gradient-to-b from-[#07111f] via-[#091526] to-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Get in Touch
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto">
              We&apos;re Here to Help Your School Succeed
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Have questions about platform features, data migration from Excel, or pricing? Our team at Groenics is ready to assist.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 lg:py-24 bg-[#07111f]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Contact Information & Channels */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Direct Contact Channels</h2>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Choose the channel that works best for your school administration.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Email Card */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">
                        ✉️
                      </div>
                      <h3 className="font-bold text-white text-base">Official Support & Enquiries</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-2">
                      For general questions, onboarding support, and partnerships:
                    </p>
                    <a
                      href="mailto:support@naysha.online"
                      className="text-blue-400 hover:text-blue-300 font-semibold text-sm transition"
                    >
                      support@naysha.online
                    </a>
                  </div>

                  {/* School Staff Login */}
                  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">
                        🔑
                      </div>
                      <h3 className="font-bold text-white text-base">Existing School Login</h3>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Are you a registered school admin, teacher, or parent trying to access your portal?
                    </p>
                    <Link
                      href="/login"
                      className="inline-flex items-center text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      Go to School ERP Login Portal →
                    </Link>
                  </div>

                  {/* Operational Information */}
                  <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 space-y-2">
                    <p>
                      <strong className="text-slate-200">Company:</strong> Groenics (Technology Provider)
                    </p>
                    <p>
                      <strong className="text-slate-200">Platform:</strong> NaySha EduCore Multi-School ERP
                    </p>
                    <p>
                      <strong className="text-slate-200">Production Customer:</strong> Jyoti Public School (Barsoi, Bihar)
                    </p>
                    <p>
                      <strong className="text-slate-200">Support Hours:</strong> Monday – Saturday, 9:00 AM – 6:30 PM IST
                    </p>
                  </div>
                </div>
              </div>

              {/* Message / Demo Request Form */}
              <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Send an Enquiry or Schedule a Demo</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Fill in your details below and our team will get in touch directly.
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

