import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request){

  try{

    const body = await req.json()

    const {
      name,
      email,
      phone,
      subject,
      qualification,
      experience_years,
      school_id,
      classes
    } = body

    if(!name || !email || !school_id){
      return NextResponse.json({ error:"Missing fields" },{ status:400 })
    }

    // =========================
    // ✅ CREATE AUTH USER
    // =========================
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true
      })

    if(authError || !authData?.user){
      return NextResponse.json({
        error: authError?.message || "Auth user not created"
      },{ status:400 })
    }

    const authId = authData.user.id
    const teacherId = crypto.randomUUID()

    // =========================
    // ✅ INSERT TEACHER
    // =========================
    const { error: teacherError } = await supabaseAdmin
      .from("teachers")
      .insert({
        id: teacherId,
        auth_id: authId,
        name,
        email,
        phone,
        subject,
        qualification,
        experience_years,
        school_id
      })

    if(teacherError){
      return NextResponse.json({ error: teacherError.message },{ status:400 })
    }

    // =========================
    // ✅ ASSIGN CLASSES
    // =========================
    if(classes?.length){
      const rows = classes.map((c:string)=>({
        teacher_id: teacherId,
        class_id: c,
        school_id
      }))

      await supabaseAdmin.from("teacher_classes").insert(rows)
    }

    // =========================
    // 🔥 MAGIC LINK
    // =========================
    const { data: linkData } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email
      })

    const magicLink = linkData?.properties?.action_link

    // =========================
    // ✅ SaaS SAFE BASE URL
    // =========================
    const baseUrl = new URL(req.url).origin

    // =========================
    // 📧 EMAIL
    // =========================
    await fetch(`${baseUrl}/api/send-email`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Your Teacher Account Created",
        message: `
          Hello ${name},<br/><br/>
          Your teacher account has been created.<br/><br/>
          👉 Login:<br/>
          <a href="${magicLink}">Click here</a>
        `
      })
    })

    // =========================
    // 📱 WHATSAPP
    // =========================
    if(phone){
      await fetch(`${baseUrl}/api/send-whatsapp`,{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          to: phone,
          message: `👨‍🏫 Teacher Account Created

Hello ${name},

Login here:
${magicLink}`
        })
      })
    }

    // =========================
    // 🔔 ADMIN NOTIFICATION
    // =========================
    await supabaseAdmin.from("notifications").insert({
      id: crypto.randomUUID(),
      school_id,
      title: "New Teacher Added",
      message: `${name} has been added as a teacher`,
      type: "system"
    })

    return NextResponse.json({
      success:true,
      teacher: { id: teacherId }
    })

  }catch(err:any){
    return NextResponse.json({ error: err.message },{ status:500 })
  }
}