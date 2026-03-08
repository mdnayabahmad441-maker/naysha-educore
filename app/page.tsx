export default function Home() {
  return (
    <main style={{padding:"40px", fontFamily:"sans-serif"}}>
      <h1>Naysha Educore ERP</h1>

      <p>Welcome to the ERP system.</p>

      <div style={{marginTop:"20px"}}>
        <a href="/create-school">Create School</a>
      </div>

      <div style={{marginTop:"10px"}}>
        <a href="/erp/login">ERP Login</a>
      </div>
    </main>
  )
}