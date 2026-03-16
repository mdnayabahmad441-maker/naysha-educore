export default function TenantPage({ params }: any) {

  return (
    <div style={{padding:40}}>
      <h1>School ERP</h1>
      <p>Tenant: {params.school}</p>
    </div>
  )

}