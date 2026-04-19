import { supabase } from "@/lib/supabase"

export default async function TenantPage({ params }: any) {

  const subdomain = params.school

  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("subdomain", subdomain)
    .maybeSingle()

  if (!school) {
    return (
      <div style={{ padding: 40 }}>
        <h1>School not found</h1>
        <p>This domain is not registered.</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>{school.name}</h1>
      <p>Domain: {school.subdomain}.naysha.online</p>
    </div>
  )
}
