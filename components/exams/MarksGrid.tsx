"use client"

import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import { saveMarks } from "@/services/marks.service"

type Props = {
  students: any[]
  subjects: any[]
  examId: string
}

export default function MarksGrid({ students, subjects, examId }: Props) {

  const [grid,setGrid] = useState<any>({})

  useEffect(()=>{

    const initial:any = {}

    students.forEach((s)=>{
      initial[s.id] = {}

      subjects.forEach((sub)=>{
        initial[s.id][sub.id] = ""
      })
    })

    setGrid(initial)

  },[students,subjects])

  const handleChange = (studentId:string,subjectId:string,value:string)=>{

    setGrid((prev:any)=>({
      ...prev,
      [studentId]:{
        ...prev[studentId],
        [subjectId]:value
      }
    }))
  }

  const save = async ()=>{

    const rows:any[] = []

    Object.keys(grid).forEach((studentId)=>{

      Object.keys(grid[studentId]).forEach((subjectId)=>{

        rows.push({
          exam_id:examId,
          student_id:studentId,
          subject_id:subjectId,
          marks:grid[studentId][subjectId]
        })

      })

    })

    await saveMarks(rows)
  }

  return (

    <div>

      <div className="overflow-x-auto">

      <table className="w-full text-sm border border-white/20">

        <thead>

          <tr>
            <th className="border p-2">Student</th>

            {subjects.map((s)=>(
              <th key={s.id} className="border p-2">
                {s.name}
              </th>
            ))}

          </tr>

        </thead>

        <tbody>

          {students.map((student)=>(
            <tr key={student.id}>

              <td className="border p-2">{student.name}</td>

              {subjects.map((sub)=>(
                <td key={sub.id} className="border p-2">

                  <input
                  className="bg-slate-800 border border-white/20 p-1 w-16"
                  value={grid?.[student.id]?.[sub.id] ?? ""}
                  onChange={(e)=>handleChange(student.id,sub.id,e.target.value)}
                  />

                </td>
              ))}

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