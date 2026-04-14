import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request){

  const { logId } = await req.json()

  const { data: log } = await supabaseAdmin
    .from("notifications_log")
    .select("*")
    .eq("id", logId)
    .single()

  if(!log){
    return NextResponse.json({ error: "Log not found" })
  }

  // 🔁 RECALL NOTIFY API
  await fetch("http://localhost:3000/api/notify", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      type: "payment",
      refId: log.ref_id
    })
  })

  return NextResponse.json({ success:true })
}