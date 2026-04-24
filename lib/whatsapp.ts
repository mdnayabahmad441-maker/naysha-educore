import { apiFetch } from "./api-client"

export async function sendWhatsApp(phone:string, message:string){

  try{
    await apiFetch("/api/send-whatsapp",{
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
