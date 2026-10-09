"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/for-schools", label: "For Schools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/security", label: "Security" },
  { href: "/contact", label: "Contact" },
]

export default function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#07111f]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-18">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition">
            <div className="w-full h-full bg-[#0d1b2f] rounded-[10px] flex items-center justify-center overflow-hidden">
              <Image
                src="/logo.png"
                alt="NaySha EduCore Logo"
                width={26}
                height={26}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-blue-400 transition">
              NaySha <span className="text-blue-500">EduCore</span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              by Groenics
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-lg transition border border-slate-700/60"
          >
            School Login
          </Link>
          <Link
            href="/book-demo"
            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md shadow-blue-600/25 transition"
          >
            Request Demo
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/login"
            className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/70 rounded-md border border-slate-700"
          >
            Login
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#07111f] px-4 pt-3 pb-6 space-y-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 text-base font-medium rounded-lg ${
                  isActive
                    ? "text-blue-400 bg-blue-500/10"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60"
            >
              School Staff & Parent Login
            </Link>
            <Link
              href="/book-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md"
            >
              Schedule Free School Demo
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

