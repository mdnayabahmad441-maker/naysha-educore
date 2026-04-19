import AdmissionEnquiryForm from "@/components/AdmissionEnquiryForm"
import { supabase } from "@/lib/supabase"

export default async function TenantAdmissionEnquiryPage({ params }: { params: { school: string } }) {
  const subdomain = params.school

  const { data: school } = await supabase
    .from("schools")
    .select("id,name")
    .eq("subdomain", subdomain)
    .maybeSingle()

  if (!school) {
    return (
      <div className="min-h-screen flex items-center justify-center p-10 bg-slate-950 text-white">
        <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-10 text-center">
          <h1 className="text-3xl font-semibold mb-4">School not found</h1>
          <p className="text-gray-400">The requested school was not found for this domain.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 text-slate-900">
      <AdmissionEnquiryForm schoolId={school.id} schoolName={school.name} />
    </div>
  )
}
