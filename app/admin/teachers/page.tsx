"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"
import ResponsiveTable from "@/components/ResponsiveTable"

export default function TeachersPage(){

  const [name,setName] = useState("")
  const [subject,setSubject] = useState("")
  const [phone,setPhone] = useState("")
  const [email,setEmail] = useState("")

  const [teachers,setTeachers] = useState<any[]>([])
  const [schoolId,setSchoolId] = useState<string | null>(null)


  useEffect(()=>{
    getSchool()
  },[])



  async function getSchool(){

    const { data:userData } =
      await supabase.auth.getUser()

    const userId = userData.user?.id

    if(!userId) return


    const { data } =
      await supabase
        .from("users")
        .select("school_id")
        .eq("id",userId)
        .single()

    if(data){

      setSchoolId(data.school_id)

      fetchTeachers(data.school_id)

    }

  }



  async function fetchTeachers(id:string){

    const { data } =
      await supabase
        .from("teachers")
        .select("*")
        .eq("school_id",id)
        .order("created_at",{ascending:false})

    if(data){
      setTeachers(data)
    }

  }



  async function addTeacher(){

    if(!name || !subject || !phone || !email){
      alert("Fill all fields")
      return
    }

    if(!schoolId){
      alert("School not found")
      return
    }


    // CREATE AUTH USER

    const { data, error:authError } =
      await supabase.auth.signUp({
        email: email,
        password: Math.random().toString(36).slice(-10)
      })

    if(authError){
      alert(authError.message)
      return
    }

    const userId = data.user?.id

    if(!userId){
      alert("User creation failed")
      return
    }


    // INSERT TEACHER RECORD

    const { error:teacherError } =
      await supabase
        .from("teachers")
        .insert({
          name:name,
          subject:subject,
          phone:phone,
          email:email,
          school_id:schoolId
        })

    if(teacherError){
      alert(teacherError.message)
      return
    }


    // INSERT USER ROLE

    const { error:userError } =
      await supabase
        .from("users")
        .insert({
          id:userId,
          email:email,
          role:"teacher",
          school_id:schoolId
        })

    if(userError){
      alert(userError.message)
      return
    }


    setName("")
    setSubject("")
    setPhone("")
    setEmail("")

    fetchTeachers(schoolId)

  }



  return(

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Teachers
      </h1>



      {/* ADD TEACHER */}

      <div className="bg-white/10 p-6 rounded-xl w-[350px] mb-10">

        <h2 className="text-xl font-bold mb-4">
          Add Teacher
        </h2>

        <input
          placeholder="Teacher Name"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Subject"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={subject}
          onChange={(e)=>setSubject(e.target.value)}
        />

        <input
          placeholder="Phone"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <input
          placeholder="Teacher Email"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <button
          onClick={addTeacher}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          Add Teacher
        </button>

      </div>



      {/* TEACHERS LIST */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl font-bold mb-6">
          Teachers List
        </h2>

       <ResponsiveTable
  columns={["Name","Subject","Phone","Email"]}
  data={teachers.map((t:any)=>({
    id:t.id,
    name:t.name,
    subject:t.subject,
    phone:t.phone,
    email:t.email
  }))}
/>

      </div>

    </div>

  )

}