"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchool } from "@/lib/school"
import Link from "next/link"

export default function StudentsPage(){

  const [students,setStudents] = useState<any[]>([])
  const [name,setName] = useState("")
  const [className,setClassName] = useState("")
  const [roll,setRoll] = useState("")
  const [filterClass,setFilterClass] = useState("")
  const [loading,setLoading] = useState(false)

  async function fetchStudents(){

    const school = await getSchool()

    if(!school) return

    let query = supabase
      .from("students")
      .select("*")
      .eq("school_id",school.id)
      .order("created_at",{ascending:false})

    if(filterClass){
      query = query.eq("class",filterClass)
    }

    const { data } = await query

    if(data){
      setStudents(data)
    }

  }

  useEffect(()=>{
    fetchStudents()
  },[filterClass])


  async function addStudent(){

    if(!name || !className || !roll){
      alert("Fill all fields")
      return
    }

    setLoading(true)

    const school = await getSchool()

    if(!school){
      alert("School not found")
      setLoading(false)
      return
    }

    // count students for this school

    const { count } = await supabase
      .from("students")
      .select("*",{count:"exact",head:true})
      .eq("school_id",school.id)

    // get school plan

    const { data:schoolData } = await supabase
      .from("schools")
      .select("student_limit")
      .eq("id",school.id)
      .single()

    const limit = schoolData?.student_limit || 50

    if((count || 0) >= limit){
      alert("Free plan allows only 50 students. Upgrade required.")
      setLoading(false)
      return
    }

    // insert student

    const { error } = await supabase
      .from("students")
      .insert({
        name:name,
        class:className,
        roll_number:roll,
        school_id:school.id
      })

    if(error){
      alert(error.message)
      setLoading(false)
      return
    }

    setName("")
    setClassName("")
    setRoll("")

    fetchStudents()

    setLoading(false)

  }


  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Student Management
      </h1>


      {/* ADD STUDENT */}

      <div className="bg-white/10 p-6 rounded-xl mb-10">

        <h2 className="text-xl mb-4">
          Add Student
        </h2>

        <div className="grid grid-cols-3 gap-4 mb-4">

          <input
            placeholder="Student Name"
            className="p-2 rounded bg-slate-800"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <input
            placeholder="Class"
            className="p-2 rounded bg-slate-800"
            value={className}
            onChange={(e)=>setClassName(e.target.value)}
          />

          <input
            placeholder="Roll Number"
            className="p-2 rounded bg-slate-800"
            value={roll}
            onChange={(e)=>setRoll(e.target.value)}
          />

        </div>

        <button
          onClick={addStudent}
          className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          {loading ? "Adding..." : "Add Student"}
        </button>

      </div>



      {/* FILTER */}

      <div className="mb-6">

        <input
          placeholder="Filter by Class"
          className="p-2 rounded bg-slate-800"
          value={filterClass}
          onChange={(e)=>setFilterClass(e.target.value)}
        />

      </div>



      {/* STUDENT LIST */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl mb-4">
          Students
        </h2>

        <table className="w-full">

          <thead>

            <tr className="border-b border-white/20 text-left">

              <th className="py-3">Name</th>
              <th>Class</th>
              <th>Roll</th>
              <th>Profile</th>

            </tr>

          </thead>

          <tbody>

            {students.map((student)=>(
              <tr key={student.id} className="border-b border-white/10">

                <td className="py-3">
                  {student.name}
                </td>

                <td>
                  {student.class}
                </td>

                <td>
                  {student.roll_number}
                </td>

                <td>

                  <Link
                    href={`/erp/dashboard/students/${student.id}`}
                    className="text-cyan-400"
                  >
                    View
                  </Link>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}