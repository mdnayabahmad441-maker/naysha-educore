import { headers } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function Dashboard() {

  /* GET DOMAIN */

  const host = (await headers()).get("host") || ""

  const rootDomain = "erp.naysha.online"

  let subdomain = ""

  if (host.includes(rootDomain)) {
    subdomain = host.replace(`.${rootDomain}`, "")
  }

  /* FIND SCHOOL */

  const { data: school, error } = await supabase
    .from("schools")
    .select("*")
    .eq("subdomain", subdomain)
    .single()

  if (error || !school) {
    return (
      <div className="min-h-screen flex items-center justify-center">

        <div className="text-center">

          <h1 className="text-3xl font-bold mb-4">
            School Not Found
          </h1>

          <p>
            This school subdomain is not registered.
          </p>

        </div>

      </div>
    )
  }

  /* DASHBOARD */

  return (

    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* SIDEBAR */}

      <aside className="w-64 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 p-6">

        <h1 className="text-2xl font-bold mb-10 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          {school.name}
        </h1>

        <nav className="space-y-4">

          <a className="block px-4 py-2 rounded-lg hover:bg-white/10">
            Dashboard
          </a>

          <a className="block px-4 py-2 rounded-lg hover:bg-white/10">
            Students
          </a>

          <a className="block px-4 py-2 rounded-lg hover:bg-white/10">
            Teachers
          </a>

          <a className="block px-4 py-2 rounded-lg hover:bg-white/10">
            Attendance
          </a>

          <a className="block px-4 py-2 rounded-lg hover:bg-white/10">
            Fees
          </a>

          <a className="block px-4 py-2 rounded-lg hover:bg-white/10">
            Exams
          </a>

        </nav>

      </aside>


      {/* MAIN */}

      <main className="flex-1 p-10">

        <h2 className="text-3xl font-bold mb-8">
          {school.name} Dashboard
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Total Students</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              0
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Teachers</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              0
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Fees Collected</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              ₹0
            </h3>
          </div>

        </div>

      </main>

    </div>

  )
}