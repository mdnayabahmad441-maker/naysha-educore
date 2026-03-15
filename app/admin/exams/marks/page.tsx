"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import Button from "@/components/ui/Button"

export default function MarksPage(){

  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [examId,setExamId] = useState("")
  const [marks,setMarks] = useState<any>({})

  useEffect(()=>{

    const load = async()=>{

      const {data:s}=await supabase.from("students").select("*")
      const {data:sub}=await supabase.from("subjects").select("*")

      setStudents(s||[])
      setSubjects(sub||[])

    }

    load()

  },[])

  const updateMark = (studentId:string,subjectId:string,value:any)=>{

    setMarks({
      ...marks,
      [`${studentId}_${subjectId}`]:value
    })

  }

  const save = async()=>{

    const rows:any[] = []

    students.forEach(student=>{

      subjects.forEach(subject=>{

        const key = `${student.id}_${subject.id}`

        if(marks[key]){

          rows.push({
            id:crypto.randomUUID(),
            exam_id:examId,
            student_id:student.id,
            subject_id:subject.id,
            marks:marks[key]
          })

        }

      })

    })

    const {error}=await supabase
      .from("marks")
      .insert(rows)

    if(error) console.error(error)

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Marks Entry</h1>

      <div className="overflow-x-auto">

        <table className="w-full text-sm border border-white/20">

          <thead>

            <tr>
              <th className="border p-2">Student</th>

              {subjects.map(sub=>(
                <th key={sub.id} className="border p-2">
                  {sub.name}
                </th>
              ))}

            </tr>

          </thead>

          <tbody>

            {students.map(student=>(

              <tr key={student.id}>

                <td className="border p-2">
                  {student.name}
                </td>

                {subjects.map(subject=>{

                  const key = `${student.id}_${subject.id}`

                  return(

                    <td key={subject.id} className="border p-2">

                      <input
                      className="bg-slate-800 border border-white/20 p-1 w-16"
                      onChange={(e)=>updateMark(
                        student.id,
                        subject.id,
                        e.target.value
                      )}
                      />

                    </td>

                  )

                })}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <div className="mt-4">

        <Button color="green" onClick={save}>
          Save Marks
        </Button>

      </div>

    </div>

  )

}