"use client"

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020c1b] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1a33] p-8 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
          NaySha EduCore
        </p>
        <h1 className="mt-3 text-2xl font-semibold">School Creation Restricted</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          New schools can only be created by the Super Admin. Please contact the platform
          owner to create a school workspace.
        </p>
        <a
          href="/login"
          className="mt-6 inline-flex rounded-xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
