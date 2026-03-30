"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"

export default function NoticesPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [title,setTitle] = useState("")
  const [message,setMessage] = useState("")

  const [mode,setMode] = useState("all") // 🔥 all | class | student
  const [selectedClass,setSelectedClass] = useState("")
  const [selectedStudent,setSelectedStudent] = useState("")

  const [classes,setClasses] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])
  const [notices,setNotices] = useState<any[]>([])

  const [sending,setSending] = useState(false)

  // SCHOOL
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // CLASSES
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .then(({data})=>setClasses(data || []))
  },[schoolId])

  // STUDENTS (for dropdown)
  useEffect(()=>{
    if(!schoolId) return

    let query = supabase
      .from("students")
      .select("id,name")
      .eq("school_id", schoolId)

    if(mode === "class" && selectedClass){
      query = query.eq("class_id", selectedClass)
    }

    query.then(({data})=>setStudents(data || []))

  },[schoolId, selectedClass, mode])

  // LOAD NOTICES
  const loadNotices = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("notices")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at",{ascending:false})

    setNotices(data || [])
  }

  useEffect(()=>{
    loadNotices()
  },[schoolId])

  // 🔥 SEND NOTICE
  const sendNotice = async ()=>{

    if(!title || !message){
      alert("Enter title and message")
      return
    }

    if(!schoolId){
      alert("School not loaded")
      return
    }

    setSending(true)

    try{

      // ✅ SAVE NOTICE
      await supabase.from("notices").insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        title,
        message,
        class_id: mode === "class" ? selectedClass : null,
        student_id: mode === "student" ? selectedStudent : null
      })

      // 🔥 TARGET STUDENTS
      let targetStudents:any[] = []

      if(mode === "all"){
        const { data } = await supabase
          .from("students")
          .select("id,name")
          .eq("school_id", schoolId)
        targetStudents = data || []
      }

      else if(mode === "class"){
        const { data } = await supabase
          .from("students")
          .select("id,name")
          .eq("class_id", selectedClass)
          .eq("school_id", schoolId)
        targetStudents = data || []
      }

      else if(mode === "student"){
        const student = students.find(s=>s.id === selectedStudent)
        if(student) targetStudents = [student]
      }

      // 🔥 GET PARENTS
      const { data: parents } = await supabase
        .from("parents")
        .select("student_id,email,phone")
        .in("student_id", targetStudents.map(s=>s.id))

      const parentMap:any = {}
      parents?.forEach((p:any)=>{
        parentMap[p.student_id] = p
      })

      // 🔥 SEND (SMART LOOP ONLY TARGETS)
      for (const s of targetStudents){

        const parent = parentMap[s.id]

        // DB
        await sendNotification({
          school_id: schoolId,
          student_id: s.id,
          title,
          message,
          type: "notice"
        })

        // EMAIL
        if(parent?.email){
          await fetch("/api/send-email",{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({
              email: parent.email,
              subject: title,
              message
            })
          })
        }

        // WHATSAPP
        if(parent?.phone){
          await fetch("/api/send-whatsapp",{
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({
              phone: parent.phone,
              message: `📢 ${title}\n\n${message}`
            })
          })
        }

      }

      alert("Notice sent successfully 🚀")

      setTitle("")
      setMessage("")
      setSelectedClass("")
      setSelectedStudent("")
      setMode("all")

      loadNotices()

    }catch(err){
      console.error(err)
      alert("Error sending notice")
    }finally{
      setSending(false)
    }
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Notices</h1>

      <div className="bg-white/10 p-6 rounded-xl space-y-4">

        <input
          placeholder="Notice Title"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          className="w-full p-3 bg-[#0b1220] rounded-xl"
        />

        <textarea
          placeholder="Notice Message"
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          className="w-full p-3 bg-[#0b1220] rounded-xl h-32"
        />

        {/* 🔥 MODE SELECT */}
        <select
          value={mode}
          onChange={(e)=>setMode(e.target.value)}
          className="w-full p-3 bg-[#0b1220] rounded-xl"
        >
          <option value="all">All Students</option>
          <option value="class">Specific Class</option>
          <option value="student">Specific Student</option>
        </select>

        {/* CLASS */}
        {mode === "class" && (
          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="w-full p-3 bg-[#0b1220] rounded-xl"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* STUDENT */}
        {mode === "student" && (
          <select
            value={selectedStudent}
            onChange={(e)=>setSelectedStudent(e.target.value)}
            className="w-full p-3 bg-[#0b1220] rounded-xl"
          >
            <option value="">Select Student</option>
            {students.map(s=>(
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}

        <button
          onClick={sendNotice}
          disabled={sending}
          className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20"
        >
          {sending ? "Sending..." : "Send Notice"}
        </button>

      </div>

      {/* LIST */}
      <div className="bg-white/10 p-6 rounded-xl space-y-4">

        <h2 className="text-lg font-semibold">Recent Notices</h2>

        {notices.map(n=>(
          <div key={n.id} className="bg-white/5 p-4 rounded-xl">
            <h3 className="font-semibold">{n.title}</h3>
            <p className="text-sm text-gray-300 mt-1">{n.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
        ))}

      </div>

    </div>
  )
}