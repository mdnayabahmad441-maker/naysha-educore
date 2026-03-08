"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CommunicationPage(){

  const [announcements,setAnnouncements] = useState<any[]>([])
  const [title,setTitle] = useState("")
  const [message,setMessage] = useState("")

  async function fetchAnnouncements(){

    const {data} =
      await supabase.from("announcements").select("*")

    if(data) setAnnouncements(data)

  }

  useEffect(()=>{
    fetchAnnouncements()
  },[])

  async function createAnnouncement(){

    await supabase.from("announcements").insert([
      {
        title:title,
        message:message
      }
    ])

    setTitle("")
    setMessage("")

    fetchAnnouncements()

  }

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Communication System
      </h1>

      {/* CREATE MESSAGE */}

      <div className="bg-white/10 p-6 rounded-xl mb-10 w-[400px]">

        <input
        placeholder="Announcement Title"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        />

        <textarea
        placeholder="Message"
        className="w-full p-2 mb-4 rounded bg-slate-800"
        value={message}
        onChange={(e)=>setMessage(e.target.value)}
        />

        <button
        onClick={createAnnouncement}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
        Send Announcement
        </button>

      </div>

      {/* ANNOUNCEMENT LIST */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl mb-4">
          Announcements
        </h2>

        <table className="w-full">

          <thead>
            <tr className="text-left text-gray-400">
              <th>Title</th>
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>

            {announcements.map((a)=>(
              <tr key={a.id} className="border-t border-gray-700">

                <td className="py-2">{a.title}</td>
                <td>{a.message}</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}