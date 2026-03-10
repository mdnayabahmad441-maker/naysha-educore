"use client"

import Link from "next/link"

export default function HomePage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="text-center">

        <h1 className="text-4xl font-bold mb-6">
          NaySha EduCore ERP
        </h1>

        <p className="text-gray-400 mb-8">
          Multi-School ERP Platform
        </p>

        <div className="flex gap-4 justify-center">

          <Link
            href="/auth/login"
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
          >
            ERP Login
          </Link>

          <Link
            href="/create-school"
            className="px-6 py-3 bg-white/10 rounded"
          >
            Register School
          </Link>

        </div>

      </div>

    </div>
  )

}