"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function FeesPage() {

  const [classes,setClasses] = useState<string[]>([])
  const [selectedClass,setSelectedClass] = useState("")

  const [students,setStudents] = useState<any[]>([])
  const [studentId,setStudentId] = useState("")

  const [hostel,setHostel] = useState(0)
  const [school,setSchool] = useState(0)
  const [exam,setExam] = useState(0)
  const [misc,setMisc] = useState(0)
  const [other,setOther] = useState(0)

  const total =
    Number(hostel) +
    Number(school) +
    Number(exam) +
    Number(misc) +
    Number(other)


  // GET ALL CLASSES
  async function fetchClasses(){

    const {data} = await supabase
      .from("students")
      .select("class")

    if(data){

      const uniqueClasses =
        [...new Set(data.map((s:any)=>s.class))]

      setClasses(uniqueClasses)

    }

  }


  // LOAD STUDENTS BY CLASS
  async function loadStudentsByClass(className:string){

    setSelectedClass(className)

    const {data} = await supabase
      .from("students")
      .select("*")
      .eq("class",className)

    if(data){
      setStudents(data)
    }

  }


  useEffect(()=>{
    fetchClasses()
  },[])


 async function generateInvoice(){

  if(!studentId){
    alert("Please select a student")
    return
  }

  const invoiceNumber =
    "INV-" + Math.floor(Math.random()*100000)

  await supabase.from("fees").insert([
    {
      student_id: studentId,
      hostel_fee: hostel,
      school_fee: school,
      exam_fee: exam,
      misc_fee: misc,
      other_fee: other,
      total: total,
      invoice_number: invoiceNumber,
      status: "Paid",
      paid_date: new Date()
    }
  ])

  alert("Invoice Generated: " + invoiceNumber)

  // reset fields
  setHostel(0)
  setSchool(0)
  setExam(0)
  setMisc(0)
  setOther(0)

}


  return (

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Fee Invoice
      </h1>

      <div className="bg-white/10 p-8 rounded-xl w-[500px]">


        {/* CLASS SELECT */}

        <select
          className="w-full p-2 mb-4 rounded bg-slate-800"
          onChange={(e)=>loadStudentsByClass(e.target.value)}
        >
          <option>Select Class</option>

          {classes.map((c)=>(
            <option key={c}>
              {c}
            </option>
          ))}

        </select>



        {/* STUDENT SELECT */}

        <select
          className="w-full p-2 mb-6 rounded bg-slate-800"
          onChange={(e)=>setStudentId(e.target.value)}
        >
          <option>Select Student</option>

          {students.map((s)=>(
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}

        </select>


        {/* FEE FIELDS */}

        <input
          type="number"
          placeholder="Hostel Fee"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={hostel}
          onChange={(e)=>setHostel(Number(e.target.value))}
        />

        <input
          type="number"
          placeholder="School Fee"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={school}
          onChange={(e)=>setSchool(Number(e.target.value))}
        />

        <input
          type="number"
          placeholder="Exam Fee"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={exam}
          onChange={(e)=>setExam(Number(e.target.value))}
        />

        <input
          type="number"
          placeholder="Misc Fee"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={misc}
          onChange={(e)=>setMisc(Number(e.target.value))}
        />

        <input
          type="number"
          placeholder="Other Fee"
          className="w-full p-2 mb-6 rounded bg-slate-800"
          value={other}
          onChange={(e)=>setOther(Number(e.target.value))}
        />


        {/* TOTAL */}

        <div className="text-xl font-bold mb-6">
          Total: ₹{total}
        </div>


        {/* GENERATE */}

        <button
          onClick={generateInvoice}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          Generate Invoice
        </button>

      </div>

    </div>
  )
}