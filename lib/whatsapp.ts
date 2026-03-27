export async function sendWhatsApp(phone:string, message:string){

  try{
    await fetch("/api/send-whatsapp",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        phone,
        message
      })
    })
  }catch(err){
    console.error("WhatsApp error:", err)
  }

}