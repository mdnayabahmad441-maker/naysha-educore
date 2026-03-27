"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"

export default function NoticesPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [title,setTitle] = useState("")
  const [message,setMessage] = useState("")
  const [selectedClass,setSelectedClass] = useState("")

  const [classes,setClasses] = useState<any[]>([])
  const [notices,setNotices] = useState<any[]>([])

  const [sending,setSending] = useState(false)

  // ✅ INIT SCHOOL
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // ✅ LOAD CLASSES
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .then(({data})=>setClasses(data || []))
  },[schoolId])

  // ✅ LOAD NOTICES
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
      const { error } = await supabase.from("notices").insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        title,
        message,
        class_id: selectedClass || null
      })

      if(error){
        alert(error.message)
        return
      }

      // ✅ GET STUDENTS
      let query = supabase
        .from("students")
        .select("*")
        .eq("school_id", schoolId)

      if(selectedClass){
        query = query.eq("class_id", selectedClass)
      }

      const { data: students } = await query

      // 🔥 SEND NOTIFICATIONS
      for (const s of students || []){

        try{
          await sendNotification({
            school_id: schoolId,
            student_id: s.id,
            title,
            message,
            type: "notice"
          })
        }catch(err){
          console.error("Notification failed:", err)
        }

      }

      alert("Notice sent successfully 🚀")

      // RESET
      setTitle("")
      setMessage("")
      setSelectedClass("")

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

      {/* CREATE NOTICE */}
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

        {/* CLASS FILTER */}
        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="w-full p-3 bg-[#0b1220] rounded-xl"
        >
          <option value="">All Classes</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={sendNotice}
          disabled={sending}
          className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20"
        >
          {sending ? "Sending..." : "Send Notice"}
        </button>

      </div>

      {/* NOTICE LIST */}
      <div className="bg-white/10 p-6 rounded-xl space-y-4">

        <h2 className="text-lg font-semibold">Recent Notices</h2>

        {notices.length === 0 && (
          <p className="text-gray-400">No notices yet</p>
        )}

        {notices.map(n=>{

          const cls = classes.find(c=>c.id === n.class_id)

          return(
            <div key={n.id} className="bg-white/5 p-4 rounded-xl">

              <h3 className="font-semibold">{n.title}</h3>

              <p className="text-sm text-gray-300 mt-1">
                {n.message}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                {cls ? `Class: ${cls.name}` : "All Students"} • {" "}
                {new Date(n.created_at).toLocaleString()}
              </p>

            </div>
          )
        })}

      </div>

    </div>
  )
}