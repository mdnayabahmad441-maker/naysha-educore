"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function StudentsPage() {

  const [students,setStudents] = useState<any[]>([])
  const [classes,setClasses] = useState<string[]>([])
  const [selectedClass,setSelectedClass] = useState("all")

  const [name,setName] = useState("")
  const [roll,setRoll] = useState("")
  const [className,setClassName] = useState("")



  // FETCH ALL STUDENTS
  async function fetchStudents(){

    const {data} =
      await supabase.from("students").select("*")

    if(data){
      setStudents(data)

      const uniqueClasses =
        [...new Set(data.map((s:any)=>s.class))]

      setClasses(uniqueClasses)

    }

  }



  useEffect(()=>{
    fetchStudents()
  },[])



  // ADD STUDENT
  async function addStudent(){

    await supabase.from("students").insert([
      {
        name:name,
        roll_number:roll,
        class:className
      }
    ])

    setName("")
    setRoll("")
    setClassName("")

    fetchStudents()

  }



  // FILTER STUDENTS
  const filteredStudents =
    selectedClass === "all"
    ? students
    : students.filter((s)=>s.class === selectedClass)



  return (

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Student Management
      </h1>


      {/* ADD STUDENT FORM */}

      <div className="bg-white/10 p-6 rounded-xl mb-10 w-[400px]">

        <h2 className="text-xl mb-4">
          Add Student
        </h2>

        <input
        placeholder="Student Name"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        />

        <input
        placeholder="Roll Number"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={roll}
        onChange={(e)=>setRoll(e.target.value)}
        />

        <input
        placeholder="Class"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={className}
        onChange={(e)=>setClassName(e.target.value)}
        />

        <button
        onClick={addStudent}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
        Add Student
        </button>

      </div>



      {/* CLASS FILTER */}

      <div className="mb-6">

        <label className="mr-3 text-gray-400">
          Filter by Class
        </label>

        <select
        className="p-2 rounded bg-slate-800"
        value={selectedClass}
        onChange={(e)=>setSelectedClass(e.target.value)}
        >

          <option value="all">
            All Students
          </option>

          {classes.map((c)=>(
            <option key={c}>
              {c}
            </option>
          ))}

        </select>

      </div>



      {/* STUDENT TABLE */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl mb-4">
          Students List
        </h2>

        <table className="w-full">

          <thead>
            <tr className="text-left text-gray-300">
              <th>Name</th>
              <th>Roll</th>
              <th>Class</th>
            </tr>
          </thead>

          <tbody>

            {filteredStudents.map((student)=>(
              <tr key={student.id} className="border-t border-gray-700">

                <td className="py-2">
              <Link
             href={`/dashboard/students/${student.id}`}
              className="text-cyan-400 hover:underline"
  >          {student.name}
             </Link>
             </td>

                <td>
                  {student.roll_number}
                </td>

                <td>
                  {student.class}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  )

}