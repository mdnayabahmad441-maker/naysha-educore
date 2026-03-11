"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExam() {

  const [schoolId,setSchoolId] = useState("")
  const [examName,setExamName] = useState("")
  const [selectedClass,setSelectedClass] = useState("")
  const [classes,setClasses] = useState<string[]>([])
  const [exams,setExams] = useState<any[]>([])



  useEffect(()=>{
    loadSchool()
  },[])



  async function loadSchool(){

    const { data } = await supabase.auth.getSession()

    const userId = data.session?.user.id

    const { data:user } = await supabase
      .from("users")
      .select("school_id")
      .eq("id",userId)
      .single()

    if(user){

      setSchoolId(user.school_id)

      loadClasses(user.school_id)
      loadExams(user.school_id)

    }

  }



  async function loadClasses(school:string){

    const { data } = await supabase
      .from("students")
      .select("class")
      .eq("school_id",school)

    const unique = [...new Set(data?.map((s:any)=>s.class))]

    setClasses(unique as string[])

  }



  async function loadExams(school:string){

    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("school_id",school)
      .order("created_at",{ascending:false})

    setExams(data || [])

  }



  async function createExam(){

    if(!examName || !selectedClass){
      alert("Fill exam name and class")
      return
    }

    const { error } = await supabase
      .from("exams")
      .insert({
        name: examName,
        class: selectedClass,
        school_id: schoolId
      })

    if(error){
      console.log(error)
      alert("Exam creation failed")
      return
    }

    alert("Exam Created Successfully")

    setExamName("")
    setSelectedClass("")

    loadExams(schoolId)

  }



  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Create Exam
      </h1>



      {/* FORM */}

      <div className="flex gap-4 mb-10">

        <input
          value={examName}
          onChange={(e)=>setExamName(e.target.value)}
          placeholder="Exam Name"
          className="bg-slate-800 p-2 rounded"
        />



        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="bg-slate-800 p-2 rounded"
        >

          <option value="">
            Select Class
          </option>

          {classes.map((c)=>(
            <option key={c}>
              {c}
            </option>
          ))}

        </select>



        <button
          onClick={createExam}
          className="bg-green-600 px-6 py-2 rounded"
        >
          Create Exam
        </button>

      </div>



      {/* EXAM LIST */}

      <h2 className="text-xl mb-4">
        Created Exams
      </h2>

      <table className="w-full border border-white/20">

        <thead>

          <tr className="bg-white/10">

            <th className="p-2 text-left">
              Exam
            </th>

            <th className="p-2">
              Class
            </th>

            <th className="p-2">
              Created
            </th>

          </tr>

        </thead>



        <tbody>

          {exams.map((exam)=>(
            <tr key={exam.id}>

              <td className="p-2">
                {exam.name}
              </td>

              <td className="p-2 text-center">
                {exam.class}
              </td>

              <td className="p-2 text-center">
                {new Date(exam.created_at).toLocaleDateString()}
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  )

}