export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-800 text-white">

      <div className="max-w-7xl mx-auto px-8 py-28 grid md:grid-cols-2 gap-16 items-center">

        {/* LEFT SIDE */}
        <div>

          <h1 className="text-6xl font-bold leading-tight bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Smart Academic
            <br />
            Command Center
          </h1>

          <p className="mt-6 text-lg text-gray-200 max-w-xl">
            A complete school ERP platform for admissions, attendance,
            fees, exams, and analytics — built with precision, trust,
            and automation.
          </p>

          <div className="flex gap-6 mt-10">

            <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 font-semibold hover:scale-105 transition">
              Access Dashboard
            </button>

            <button className="px-6 py-3 rounded-xl border border-cyan-400 text-cyan-300 hover:bg-white/10 transition">
              Request Demo
            </button>

          </div>

        </div>

        {/* RIGHT SIDE STATS */}
        <div className="grid grid-cols-3 gap-6">

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg">
            <p className="text-gray-300 text-sm">Total Students</p>
            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              1,248
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg">
            <p className="text-gray-300 text-sm">Attendance Today</p>
            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              96%
            </h2>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg">
            <p className="text-gray-300 text-sm">Fees Collected</p>
            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              ₹8.2L
            </h2>
          </div>

        </div>

      </div>

    </main>
  );
}