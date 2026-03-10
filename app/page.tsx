"use client"

import Link from "next/link"
import Image from "next/image"

export default function HomePage(){

  return(

    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}

      <header className="flex items-center justify-between px-10 py-6">

        <div className="flex items-center gap-4">

          <Image
            src="/logo.png"
            alt="NaySha Logo"
            width={50}
            height={50}
          />

          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            NaySha Automation
          </h1>

        </div>

      </header>



      {/* HERO SECTION */}

      <section className="flex flex-col items-center justify-center text-center px-6 mt-20">

        <h2 className="text-5xl font-bold mb-6">
          NaySha EduCore ERP
        </h2>

        <p className="text-gray-400 max-w-3xl text-lg mb-10">

          NaySha EduCore is a powerful multi-school ERP platform designed to
          simplify school management. Manage students, teachers, attendance,
          exams, fees, report cards and parent communication from a single
          intelligent dashboard.

          Built for modern schools, EduCore automates administrative tasks,
          improves transparency and connects administrators, teachers and
          parents through one secure system.

        </p>



        {/* BUTTONS */}

        <div className="flex gap-6">

          <Link
            href="/create-school"
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg text-lg font-semibold hover:scale-105 transition"
          >
            Create School
          </Link>

          <Link
            href="/auth/login"
            className="px-8 py-4 bg-white/10 rounded-lg text-lg hover:bg-white/20 transition"
          >
            Login
          </Link>

        </div>

      </section>



      {/* FEATURES */}

      <section className="grid md:grid-cols-3 gap-8 px-16 mt-28 pb-20">

        <div className="bg-white/5 p-6 rounded-xl backdrop-blur">

          <h3 className="text-xl font-bold mb-3">
            Complete School Management
          </h3>

          <p className="text-gray-400">
            Manage students, teachers, classes and academic records in one
            centralized ERP system.
          </p>

        </div>


        <div className="bg-white/5 p-6 rounded-xl backdrop-blur">

          <h3 className="text-xl font-bold mb-3">
            Smart Attendance & Exams
          </h3>

          <p className="text-gray-400">
            Class-wise attendance, marks entry, automatic results and report
            cards generation.
          </p>

        </div>


        <div className="bg-white/5 p-6 rounded-xl backdrop-blur">

          <h3 className="text-xl font-bold mb-3">
            Parent Portal
          </h3>

          <p className="text-gray-400">
            Parents can track attendance, download invoices, view results and
            report cards anytime.
          </p>

        </div>

      </section>



      {/* FOOTER */}

      <footer className="text-center text-gray-500 pb-10">

        © {new Date().getFullYear()} NaySha Automation — All Rights Reserved

      </footer>

    </div>

  )

}