"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"

export default function NotificationsPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [notifications,setNotifications] = useState<any[]>([])
  const [classes,setClasses] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [title,setTitle] = useState("")
  const [message,setMessage] = useState("")

  // =========================
  // INIT SCHOOL
  // =========================
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // =========================
  // LOAD DATA
  // =========================
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{

      const { data: notif } = await supabase
        .from("notifications")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at",{ascending:false})

      setNotifications(notif || [])

      const { data: cls } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)

      setClasses(cls || [])
    }

    load()

  },[schoolId])

  // =========================
  // SEND TO CLASS (FIXED)
  // =========================
  const sendToClass = async ()=>{

    if(!selectedClass || !title || !message){
      alert("Fill all fields")
      return
    }

    if(!schoolId){
      alert("School not loaded")
      return
    }

    // 🔥 GET STUDENTS OF CLASS
    const { data: students } = await supabase
      .from("students")
      .select("id")
      .eq("class_id", selectedClass)
      .eq("school_id", schoolId)

    // 🔥 LOOP + SEND (THIS FIXES YOUR ERROR)
    for(const s of students || []){

      try{
        await sendNotification({
          school_id: schoolId,
          student_id: s.id,
          title,
          message,
          type: "general"
        })
      }catch(err){
        console.error("Notification failed:", err)
      }

    }

    alert("Notification sent ✅")

    setTitle("")
    setMessage("")
    setSelectedClass("")

    // 🔄 reload
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at",{ascending:false})

    setNotifications(data || [])
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Notifications
      </h1>

      {/* SEND PANEL */}
      <div className="bg-white/10 border border-white/10 p-6 rounded-xl space-y-4">

        <h2 className="text-lg font-semibold">
          Send Notification
        </h2>

        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="w-full p-3 bg-[#0b1220] border border-white/10 rounded-xl"
        >
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          placeholder="Title"
          className="w-full p-3 bg-[#0b1220] border border-white/10 rounded-xl"
        />

        <textarea
          value={message}
          onChange={(e)=>setMessage(e.target.value)}
          placeholder="Message"
          className="w-full p-3 bg-[#0b1220] border border-white/10 rounded-xl"
        />

        <button
          onClick={sendToClass}
          className="px-6 py-3 bg-white/10 border border-white/10 rounded-xl hover:bg-white/20"
        >
          Send
        </button>

      </div>

      {/* LIST */}
      <div className="space-y-4">

        {notifications.length === 0 && (
          <p className="text-gray-400">
            No notifications yet
          </p>
        )}

        {notifications.map(n=>(
          <div
            key={n.id}
            className="bg-white/10 border border-white/10 p-4 rounded-xl"
          >

            <div className="flex justify-between items-center">

              <h2 className="font-semibold">
                {n.title}
              </h2>

              <span className="text-xs text-gray-400">
                {new Date(n.created_at).toLocaleString()}
              </span>

            </div>

            <p className="text-gray-300 mt-2">
              {n.message}
            </p>

            <div className="mt-2 text-xs text-blue-400">
              {n.type}
            </div>

          </div>
        ))}

      </div>

    </div>
  )
}