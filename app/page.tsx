import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import MarketingNav from "@/components/marketing/MarketingNav"
import MarketingFooter from "@/components/marketing/MarketingFooter"
import BookDemoForm from "@/components/marketing/BookDemoForm"

export const metadata = {
  title: "NaySha EduCore — Modern Multi-School ERP Platform",
  description:
    "Cloud-native school management SaaS platform by Groenics. Real-time attendance with GPS verification, automated fee collection, report cards, and parent WhatsApp notifications.",
  alternates: {
    canonical: "https://naysha.online",
  },
}

export default async function Page() {
  const headersList = await headers()
  const host = headersList.get("host") || ""
  const xTenant = headersList.get("x-tenant")

  // Subdomain & App routing preservation:
  // If accessed via a school subdomain (e.g. jpsbarsoi.naysha.online) or the ERP mobile app host (erp.naysha.online),
  // preserve existing direct ERP entry by redirecting to /login
  const cleanHost = host.split(":")[0].trim().toLowerCase()
  const subdomain = cleanHost.split(".")[0] || ""
  if (
    xTenant ||
    (subdomain &&
      subdomain !== "naysha" &&
      subdomain !== "www" &&
      !cleanHost.includes("localhost") &&
      !cleanHost.includes("127.0.0.1"))
  ) {
    redirect("/login")
  }

  // Structured Data Schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://naysha.online/#organization",
        name: "NaySha EduCore",
        legalName: "Groenics",
        url: "https://naysha.online",
        logo: "https://naysha.online/logo.png",
        contactPoint: {
          "@type": "ContactPoint",
          email: "support@naysha.online",
          contactType: "customer support",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://naysha.online/#software",
        name: "NaySha EduCore ERP",
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web, Android",
        offers: {
          "@type": "Offer",
          price: "180",
          priceCurrency: "INR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "180",
            priceCurrency: "INR",
            unitText: "student / year",
          },
        },
        publisher: {
          "@id": "https://naysha.online/#organization",
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <MarketingNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 border-b border-slate-800/80 bg-gradient-to-b from-[#07111f] via-[#091527] to-[#07111f]">
          {/* Subtle background glow */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-medium mb-8">
              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
              Production-Proven School ERP Platform by Groenics
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
              The Modern Multi-School ERP Engineered for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
                Indian Schools
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Complete academic & administrative control in one high-speed platform. 
              Real-time attendance with GPS geofencing, zero-leakage fee management, 
              automated report cards, and instant WhatsApp alerts directly to parents.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/book-demo"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-xl shadow-blue-600/30 transition transform hover:-translate-y-0.5"
              >
                Book a Live School Demo
              </Link>
              <Link
                href="/features"
                className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700/80 transition"
              >
                Explore Modules
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3.5 text-base font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded-xl transition"
              >
                School Login →
              </Link>
            </div>

            {/* Quick Proof Highlights */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-slate-800/60">
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-2xl lg:text-3xl font-bold text-white">680+</p>
                <p className="text-xs text-slate-400 mt-1">Students in Production</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-2xl lg:text-3xl font-bold text-blue-400">100%</p>
                <p className="text-xs text-slate-400 mt-1">GPS Attendance Accuracy</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-2xl lg:text-3xl font-bold text-cyan-400">Meta API</p>
                <p className="text-xs text-slate-400 mt-1">Official WhatsApp Cloud</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
                <p className="text-2xl lg:text-3xl font-bold text-emerald-400">₹180</p>
                <p className="text-xs text-slate-400 mt-1">Per Student / Year</p>
              </div>
            </div>
          </div>
        </section>

        {/* Verified School In Action Section */}
        <section className="py-16 lg:py-24 bg-[#050c18] border-b border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Real Production Reference
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Proven in Daily Operation at Jyoti Public School
                </h2>
                <p className="mt-4 text-slate-300 leading-relaxed">
                  NaySha EduCore is not an unverified concept. It powers real daily operations at{" "}
                  <strong>Jyoti Public School (Barsoi, Bihar)</strong> under dedicated subdomain{" "}
                  <code className="text-blue-400 text-sm bg-blue-950/60 px-2 py-0.5 rounded">
                    jpsbarsoi.naysha.online
                  </code>.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-emerald-400 font-bold">✓</span>
                    <p className="text-sm text-slate-300">
                      <strong>681 Students & 21 Classes:</strong> Full student lifecycle, roll management, and section grouping.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-emerald-400 font-bold">✓</span>
                    <p className="text-sm text-slate-300">
                      <strong>18 Teachers & 55 Subjects:</strong> Geo-fenced teacher attendance, timetable assignment, and marks entry.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-emerald-400 font-bold">✓</span>
                    <p className="text-sm text-slate-300">
                      <strong>Fee Records & Receipts:</strong> Automated fee collection with instant digital PDF receipt generation.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex gap-4">
                  <Link
                    href="/for-schools"
                    className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Read how EduCore scales schools →
                  </Link>
                </div>
              </div>

              {/* Visual Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-[#0c182c] border border-slate-800 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-lg">
                      JP
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Jyoti Public School</h3>
                      <p className="text-xs text-slate-400">Barsoi, Bihar • Active Customer</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Live Production
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <p className="text-lg font-bold text-white">681</p>
                    <p className="text-[11px] text-slate-400">Students</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <p className="text-lg font-bold text-white">21</p>
                    <p className="text-[11px] text-slate-400">Classes</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40">
                    <p className="text-lg font-bold text-white">18</p>
                    <p className="text-[11px] text-slate-400">Teachers</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-900/50 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-blue-300">Verified Contract Terms:</strong> 1-Year SaaS agreement at ₹180 per student per year (₹122,580 Annual Contract Value). Full platform support, maintenance, and multi-tenant isolation.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Modules Grid */}
        <section className="py-16 lg:py-24 bg-[#07111f] border-b border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                End-To-End School Management
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything Your School Needs to Run Smoothly
              </h2>
              <p className="mt-4 text-slate-300">
                From morning roll call to annual report cards, NaySha EduCore replaces fragmented registers, spreadsheets, and SMS gateways with a single integrated system.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl mb-4">
                  📍
                </div>
                <h3 className="text-lg font-bold text-white">GPS Teacher Attendance</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Location-verified check-in and check-out prevents proxy attendance. Teachers mark attendance only when physically present within configured school coordinates.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl mb-4">
                  💳
                </div>
                <h3 className="text-lg font-bold text-white">Fee Management & Receipts</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Track installments, fee concessions, dues, and payment modes. Instant generation of branded, printable PDF fee receipts eliminates accounting discrepancies.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center font-bold text-xl mb-4">
                  💬
                </div>
                <h3 className="text-lg font-bold text-white">WhatsApp Parent Alerts</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Powered by official Meta WhatsApp Cloud API. Parents receive automated notices, fee reminders, admission confirmations, and attendance updates with 98% open rates.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xl mb-4">
                  📊
                </div>
                <h3 className="text-lg font-bold text-white">Exams & Digital Report Cards</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Configure exam terms, subject maximums, and passing thresholds. Teachers enter marks quickly, and the platform auto-generates student report cards ready to print.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xl mb-4">
                  🤖
                </div>
                <h3 className="text-lg font-bold text-white">AI Question Paper Generator</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Integrated Anthropic Claude AI assistant empowers teachers to generate comprehensive, balanced question papers and classroom assignments in seconds.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-xl mb-4">
                  🛡️
                </div>
                <h3 className="text-lg font-bold text-white">Dedicated Role Portals</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Tailored web & Android experiences for School Admins (`/admin`), Teachers (`/teacher`), and Parents (`/parent`), strictly isolated by PostgreSQL Row-Level Security.
                </p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/features"
                className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300"
              >
                View complete module specifications and technical details →
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section className="py-16 lg:py-24 bg-[#050c18] border-b border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Simple, Honest Pricing
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                ₹180 per student / year. No Hidden Fees.
              </h2>
              <p className="mt-4 text-slate-300">
                Transparent pricing structured for Indian private schools. All modules, updates, cloud hosting, and technical onboarding included.
              </p>
            </div>

            <div className="mt-12 max-w-lg mx-auto p-8 rounded-3xl bg-slate-900/80 border border-blue-500/30 shadow-2xl relative">
              <div className="absolute -top-3 right-6 px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-md">
                All-Inclusive Annual SaaS
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-white">₹180</span>
                <span className="text-slate-400 text-sm">/ student / year</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Billed annually • Advance contract</p>

              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Full ERP suite (Admissions, Fees, Exams, Attendance)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>GPS-verified Teacher & Staff Attendance</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Automated WhatsApp parent alerts & notices</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Admin, Teacher, and Parent portals (Web + Android App)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Dedicated subdomain (e.g. yourschool.naysha.online)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Zero setup fees • Data migration assistance from Excel</span>
                </div>
              </div>

              <div className="mt-8">
                <Link
                  href="/book-demo"
                  className="block w-full py-3.5 text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition"
                >
                  Schedule Free School Walkthrough
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Request Interactive Section */}
        <section id="demo" className="py-16 lg:py-24 bg-[#07111f] border-b border-slate-800/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  Get Started in 48 Hours
                </span>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Book a Live Customized School Demo
                </h2>
                <p className="mt-4 text-slate-300 leading-relaxed">
                  See how NaySha EduCore handles your school&apos;s specific classes, fee structures, and attendance workflow. Our deployment team handles full data migration and staff onboarding.
                </p>

                <div className="mt-8 space-y-4 text-sm text-slate-300">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h4 className="font-bold text-white">1. Quick 20-Minute Walkthrough</h4>
                    <p className="text-slate-400 text-xs mt-1">We demonstrate the admin dashboard, mobile app, and WhatsApp messaging tailored to your school size.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h4 className="font-bold text-white">2. Free Excel Data Migration</h4>
                    <p className="text-slate-400 text-xs mt-1">Provide your current student list in Excel; we import students, sections, and roll numbers automatically.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h4 className="font-bold text-white">3. Direct Teacher & Admin Training</h4>
                    <p className="text-slate-400 text-xs mt-1">We train your administrative staff and teachers so your school is live without downtime.</p>
                  </div>
                </div>
              </div>

              {/* Form Container */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-2">Request School Demonstration</h3>
                <p className="text-xs text-slate-400 mb-6">Enter your school details below to schedule a walkthrough.</p>
                <BookDemoForm />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 lg:py-20 bg-[#050c18]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                Frequently Asked Questions
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Everything You Need to Know
              </h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="font-bold text-white text-base">How does teacher GPS attendance prevent proxy attendance?</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  When a teacher taps &quot;Check In&quot; or &quot;Check Out&quot; on their mobile device, NaySha EduCore verifies their GPS coordinates against the school&apos;s configured latitude and longitude. Check-ins are rejected if the device is outside the authorized radius.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="font-bold text-white text-base">How do parents receive fee reminders and notices?</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  NaySha EduCore is integrated directly with the official Meta WhatsApp Cloud API. Important announcements, fee receipts, dues reminders, and attendance updates are delivered directly to parents&apos; personal WhatsApp inbox.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="font-bold text-white text-base">Can we migrate existing student records from Excel?</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Yes. NaySha EduCore includes built-in CSV/Excel bulk import capabilities for students, teachers, and classes. Our onboarding team also provides full end-to-end data preparation assistance.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                <h3 className="font-bold text-white text-base">Is our school data isolated from other schools?</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Yes. NaySha EduCore enforces PostgreSQL Row-Level Security (RLS) policies and school-specific tenant isolation. No school can view, query, or mutate another school&apos;s student, fee, or academic records.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  )
}
