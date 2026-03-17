"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function AdminDashboard() {

  const [schoolName, setSchoolName] = useState<string>("")

  useEffect(() => {

    const loadSchool = async () => {

      const schoolId = await getSchoolId()

      if(!schoolId) return

      const { data } = await supabase
        .from("schools")
        .select("name")
        .eq("id", schoolId)
        .single()

      if(data){
        setSchoolName(data.name)
      }

    }

    loadSchool()

  }, [])

  return (

    <div>

      <h1 className="text-3xl font-bold mb-2">
        {schoolName ? `${schoolName} Dashboard` : "Admin Dashboard"}
      </h1>

      <p className="text-gray-400">
        Welcome to your school ERP dashboard.
      </p>

    </div>

  )
}