"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminDashboard() {

  const [schools,setSchools] = useState<any[]>([])

  async function loadSchools(){

    const { data:schoolData } =
      await supabase
        .from("schools")
        .select("*")

    if(!schoolData) return

    const schoolsWithStats = await Promise.all(

      schoolData.map(async (school:any)=>{

        const { count:studentCount } =
          await supabase
            .from("students")
            .select("*",{count:"exact",head:true})
            .eq("school_id",school.id)

        const { count:teacherCount } =
          await supabase
            .from("teachers")
            .select("*",{count:"exact",head:true})
            .eq("school_id",school.id)

        return{
          ...school,
          students: studentCount || 0,
          teachers: teacherCount || 0
        }

      })

    )

    setSchools(schoolsWithStats)

  }

  useEffect(()=>{
    loadSchools()
  },[])


  return(

    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">

      <h1 className="text-2xl md:text-3xl font-bold mb-8">
        NaySha Super Admin
      </h1>


      {/* TABLE CONTAINER */}

      <div className="bg-white/10 p-6 rounded-xl overflow-x-auto">

        <h2 className="text-xl mb-6">
          Registered Schools
        </h2>

        <table className="min-w-[900px] w-full">

          <thead>

            <tr className="text-left border-b border-white/20 text-sm md:text-base">

              <th className="py-3 pr-6 min-w-[180px]">School</th>

              <th className="pr-6 min-w-[220px]">Email</th>

              <th className="pr-6 min-w-[140px]">Phone</th>

              <th className="pr-6 min-w-[90px]">Students</th>

              <th className="pr-6 min-w-[90px]">Teachers</th>

              <th className="min-w-[220px]">Subdomain</th>

            </tr>

          </thead>

          <tbody>

            {schools.map((school)=>(
              <tr
                key={school.id}
                className="border-b border-white/10 text-sm md:text-base"
              >

                <td className="py-4 pr-6">
                  {school.name}
                </td>

                <td className="pr-6 break-all">
                  {school.email}
                </td>

                <td className="pr-6">
                  {school.phone}
                </td>

                <td className="pr-6 text-cyan-400 font-semibold">
                  {school.students}
                </td>

                <td className="pr-6 text-purple-400 font-semibold">
                  {school.teachers}
                </td>

                <td className="break-all">

                  <a
                    href={`http://${school.subdomain}.naysha.online/erp`}
                    className="text-cyan-400 hover:underline"
                  >
                    {school.subdomain}.naysha.online
                  </a>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}