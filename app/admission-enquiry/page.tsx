import AdmissionEnquiryForm from "@/components/AdmissionEnquiryForm"
import { supabase } from "@/lib/supabase"
import { headers } from "next/headers"

export default async function AdmissionEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>
}) {
  const host = (await headers()).get("host") || ""
  const parts = host.split(".")
  const hostSubdomain = parts[0]
  const { school: schoolParam } = await searchParams

  // Determine subdomain: prefer ?school= query param, then hostname subdomain
  const NON_SCHOOL = ["erp", "www", "app", "localhost", "127"]
  const subdomain =
    schoolParam?.trim() ||
    (NON_SCHOOL.some((s) => hostSubdomain.startsWith(s)) ? "" : hostSubdomain)

  if (!subdomain) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 bg-slate-950 text-white">
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-10 text-center">
          <h1 className="text-3xl font-semibold mb-4">School not found</h1>
          <p className="text-gray-400">
            Use a school-specific URL or add <code>?school=yourschool</code> to the address.
          </p>
        </div>
      </div>
    )
  }

  const { data: school } = await supabase
    .from("schools")
    .select("id,name,subdomain")
    .eq("subdomain", subdomain)
    .maybeSingle()

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 bg-slate-950 text-white">
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-10 text-center">
          <h1 className="text-3xl font-semibold mb-4">School not found</h1>
          <p className="text-gray-400">No school found for <strong>{subdomain}</strong>.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-8 sm:py-10 px-4 text-slate-900">
      <AdmissionEnquiryForm
        schoolId={school.id}
        schoolName={school.name}
      />
    </div>
  )
}
