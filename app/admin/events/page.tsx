"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function EventsPage(){

const [events,setEvents] = useState<any[]>([])
const [loading,setLoading] = useState(true)

const [title,setTitle] = useState("")
const [type,setType] = useState("Academic")
const [date,setDate] = useState("")

const [schoolId,setSchoolId] = useState<string | null>(null)

useEffect(()=>{
  getSchoolId().then(setSchoolId)
},[])

useEffect(()=>{
  if(!schoolId) return

  const load = async ()=>{

    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("school_id",schoolId)
      .order("date",{ascending:false})

    setEvents(data || [])
    setLoading(false)
  }

  load()

},[schoolId])

// 🔥 AUTO STATUS
const getStatus = (eventDate:string)=>{
  const today = new Date().toISOString().split("T")[0]
  return eventDate >= today ? "upcoming" : "completed"
}

// 🔥 ADD EVENT
const addEvent = async ()=>{

  if(!title || !date){
    alert("Fill all fields")
    return
  }

  const status = getStatus(date)

  const { error } = await supabase
    .from("events")
    .insert({
      id: crypto.randomUUID(),
      school_id: schoolId,
      title,
      type,
      date,
      status
    })

  if(error){
    alert(error.message)
    return
  }

  setTitle("")
  setDate("")

  // reload
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("school_id",schoolId)
    .order("date",{ascending:false})

  setEvents(data || [])
}

return(

<div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-8">

{/* HEADER */}
<div className="flex justify-between items-center">

<div>
<h1 className="text-2xl font-bold">Events & Calendar</h1>
<p className="text-gray-400 text-sm">
{events.length} events
</p>
</div>

</div>

{/* ADD EVENT */}
<div className="bg-white/5 border border-white/10 p-6 rounded-xl grid md:grid-cols-4 gap-4">

<input
placeholder="Event title"
value={title}
onChange={(e)=>setTitle(e.target.value)}
className="px-4 py-2 bg-[#0b1220] rounded-lg"
/>

<select
value={type}
onChange={(e)=>setType(e.target.value)}
className="px-4 py-2 bg-[#0b1220] rounded-lg"
>
<option>Academic</option>
<option>Sports</option>
<option>Meeting</option>
<option>Cultural</option>
<option>Exam</option>
</select>

<input
type="date"
value={date}
onChange={(e)=>setDate(e.target.value)}
className="px-4 py-2 bg-[#0b1220] rounded-lg"
/>

<button
onClick={addEvent}
className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg px-4"
>
+ Add Event
</button>

</div>

{/* EVENTS GRID */}
<div className="grid md:grid-cols-2 gap-6">

{loading ? (
<p className="text-gray-400">Loading...</p>
) : events.length === 0 ? (
<p className="text-gray-400">No events yet</p>
) : (
events.map((e)=>{

const status = e.status
const isUpcoming = status === "upcoming"

return(

<div
key={e.id}
className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3"
>

{/* TAGS */}
<div className="flex justify-between">

<span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
{e.type}
</span>

<span className={`text-xs px-3 py-1 rounded-full ${
isUpcoming
? "bg-blue-500/20 text-blue-300"
: "bg-green-500/20 text-green-300"
}`}>
{status}
</span>

</div>

{/* TITLE */}
<h2 className="text-lg font-semibold">
{e.title}
</h2>

{/* DATE */}
<p className="text-sm text-gray-400">
📅 {new Date(e.date).toDateString()}
</p>

</div>

)
})
)}

</div>

</div>
)
}