import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-800 text-white">

      {/* NAVBAR */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">

        <h1 className="text-xl font-bold tracking-wide">
          Naysha Educore
        </h1>

        <div className="flex gap-4">

          <Link
            href="/create-school"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold hover:opacity-90 transition"
          >
            Create School
          </Link>

          <Link
            href="/erp/login"
            className="px-4 py-2 rounded-lg border border-cyan-400 text-cyan-300 hover:bg-white/10 transition"
          >
            ERP Login
          </Link>

        </div>

      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">

        {/* LEFT */}
        <div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Smart Academic
            <br />
            Command Center
          </h1>

          <p className="mt-6 text-gray-200 text-base sm:text-lg max-w-xl">
            A complete school ERP platform for admissions, attendance,
            fees, exams and analytics — built with precision, trust
            and automation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">

            <Link
              href="/create-school"
              className="px-6 py-3 text-center rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold hover:scale-105 transition"
            >
              Start Your School ERP
            </Link>

            <Link
              href="/erp/login"
              className="px-6 py-3 text-center rounded-xl border border-cyan-400 text-cyan-300 hover:bg-white/10 transition"
            >
              Login to Dashboard
            </Link>

          </div>

        </div>

        {/* RIGHT STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl text-center shadow-lg">
            <p className="text-gray-300 text-sm">Total Students</p>
            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              1,248
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl text-center shadow-lg">
            <p className="text-gray-300 text-sm">Attendance Today</p>
            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              96%
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl text-center shadow-lg">
            <p className="text-gray-300 text-sm">Fees Collected</p>
            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              ₹8.2L
            </h2>
          </div>

        </div>

      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 pb-24">

        <h2 className="text-3xl font-bold text-center mb-12">
          Everything Your School Needs
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
            <h3 className="font-semibold text-lg mb-2">Admissions</h3>
            <p className="text-gray-300 text-sm">
              Manage new student admissions and enrollment with ease.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
            <h3 className="font-semibold text-lg mb-2">Attendance</h3>
            <p className="text-gray-300 text-sm">
              Track daily student attendance with automated reports.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-xl backdrop-blur">
            <h3 className="font-semibold text-lg mb-2">Fees</h3>
            <p className="text-gray-300 text-sm">
              Collect and manage school fees with complete transparency.
            </p>
          </div>

        </div>

      </section>

      {/* FOOTER */}
      <footer className="text-center pb-10 text-gray-400 text-sm">
        © {new Date().getFullYear()} Naysha Automation
      </footer>

    </main>
  )
}