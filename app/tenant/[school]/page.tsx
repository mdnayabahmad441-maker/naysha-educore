import { supabase } from "@/lib/supabase"

export default async function TenantPage({
  params,
}: {
  params: { school: string }
}) {

  const subdomain = params.school

  // fetch school from database
  const { data: school, error } = await supabase
    .from("schools")
    .select("*")
    .eq("subdomain", subdomain)
    .single()

  if (error || !school) {
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

      <p>
        <strong>Domain:</strong> {subdomain}.naysha.online
      </p>

      <p>
        <strong>Email:</strong> {school.email}
      </p>

      <p>
        <strong>Phone:</strong> {school.phone}
      </p>

      <hr style={{ margin: "30px 0" }} />

      <h2>Welcome to {school.name} ERP</h2>
      <p>This ERP instance belongs to this school.</p>
    </div>
  )
}