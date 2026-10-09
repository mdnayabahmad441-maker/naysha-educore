import Link from "next/link"
import Image from "next/image"

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-800 bg-[#050c17] text-slate-400 text-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px]">
                <div className="w-full h-full bg-[#0d1b2f] rounded-[7px] flex items-center justify-center overflow-hidden">
                  <Image
                    src="/logo.png"
                    alt="NaySha EduCore Logo"
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                NaySha <span className="text-blue-500">EduCore</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Enterprise-grade multi-school ERP and education SaaS platform developed and operated by{" "}
              <strong className="text-slate-200">Groenics</strong>. Powering daily academic operations,
              attendance with GPS verification, fee collections, and automated WhatsApp parent communication.
            </p>
            <div className="pt-2 text-xs text-slate-500 space-y-1">
              <p>Verified Production Reference: Jyoti Public School (Barsoi, Bihar)</p>
              <p>Operating 680+ students, 21 classes, 18 faculty members.</p>
            </div>
          </div>

          {/* Product & Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Product & Modules
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="hover:text-blue-400 transition">
                  Platform Features
                </Link>
              </li>
              <li>
                <Link href="/for-schools" className="hover:text-blue-400 transition">
                  Solutions by Role
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-blue-400 transition">
                  Transparent Pricing
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-blue-400 transition">
                  Security & Architecture
                </Link>
              </li>
              <li>
                <Link href="/book-demo" className="hover:text-blue-400 transition">
                  Schedule School Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Company & Contact
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-blue-400 transition">
                  About Groenics & EduCore
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition">
                  Contact Support
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@naysha.online"
                  className="hover:text-blue-400 transition break-all"
                >
                  support@naysha.online
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-400 transition text-slate-300 font-medium">
                  → School ERP Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Trust & Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="hover:text-blue-400 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-400 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/data-deletion" className="hover:text-blue-400 transition">
                  Data Deletion & Rights
                </Link>
              </li>
              <li>
                <Link href="/security" className="hover:text-blue-400 transition">
                  Data Isolation & RLS
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            © {currentYear} NaySha EduCore. A product of Groenics. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-400">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-400">
              Terms
            </Link>
            <Link href="/security" className="hover:text-slate-400">
              Security
            </Link>
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              ERP Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

