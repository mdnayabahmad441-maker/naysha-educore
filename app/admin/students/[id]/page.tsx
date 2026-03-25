"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation" // ✅ UPDATED
import { getUserRole } from "@/lib/getUserRole"

export default function StudentProfile(){

  const { id } = useParams()
  const router = useRouter() // ✅ ADDED

  const [tab,setTab] = useState("profile")

  const [student,setStudent] = useState<any>(null)
  const [parent,setParent] = useState<any>(null)
  const [documents,setDocuments] = useState<any[]>([])
  const [attendance,setAttendance] = useState<any[]>([])
  const [payments,setPayments] = useState<any[]>([])

  useEffect(() => {
    const checkRole = async () => {
      const roleData = await getUserRole()

      if (roleData?.role === "teacher") {
        window.location.href = "/unauthorized"
      }
    }

    checkRole()
  }, [])

  useEffect(()=>{

    const load = async()=>{

      const { data:studentData } = await supabase
        .from("students")
        .select(`
          *,
          classes(name),
          sections(name)
        `)
        .eq("id",id)
        .single()

      setStudent(studentData)

      const { data:parentData } = await supabase
        .from("parents")
        .select("*")
        .eq("student_id",id)
        .maybeSingle()

      setParent(parentData)

      const { data:docData } = await supabase
        .from("student_documents")
        .select("*")
        .eq("student_id",id)

      setDocuments(docData || [])

      const { data:attData } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id",id)
        .order("date",{ascending:false})

      setAttendance(attData || [])

      const { data:payData } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id",id)
        .order("date",{ascending:false})

      setPayments(payData || [])

    }

    load()

  },[id])

  if(!student){
    return <div className="p-10 text-white">Loading...</div>
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="bg-white/10 border border-white/10 rounded-xl p-6 mb-6 flex flex-col md:flex-row gap-6 items-center">

        {/* PHOTO */}
        {student.photo && (
          <img
            src={student.photo}
            className="w-28 h-28 rounded-full object-cover border border-white/20"
          />
        )}

        <div>

          <h1 className="text-2xl font-semibold">
            {student.name}
          </h1>

          <p className="text-gray-400 mt-1">
            {student.email}
          </p>

          <div className="text-sm text-gray-300 mt-3 space-y-1">
            <p>Roll: {student.roll_number || "-"}</p>
            <p>Class: {student.classes?.name || "-"}</p>
            <p>Section: {student.sections?.name || "-"}</p>
          </div>

          {/* ✅ EDIT BUTTON ADDED */}
          <button
            onClick={()=>router.push(`/admin/students/${id}/edit`)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            Edit Student
          </button>

        </div>

      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-3 mb-6">

        {["profile","attendance","payments","documents","reportcards"].map(t=>(
          <button
            key={t}
            onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-xl border ${
              tab===t
                ? "bg-white/20 border-white/20"
                : "bg-white/5 border-white/10"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}

      </div>

      {/* PROFILE */}
      {tab==="profile" && (

        <div className="bg-white/10 p-6 rounded-xl space-y-6">

          <div>
            <h2 className="text-lg mb-3">Student Details</h2>

            <p>Name: {student.name}</p>
            <p>Email: {student.email}</p>
            <p>Roll: {student.roll_number}</p>
          </div>

          <div>
            <h2 className="text-lg mb-3">Parents</h2>

            <p>Father: {parent?.father_name || "-"}</p>
            <p>Mother: {parent?.mother_name || "-"}</p>
            <p>Phone: {parent?.phone || "-"}</p>
            <p>Email: {parent?.email || "-"}</p>
          </div>

        </div>

      )}

      {/* ATTENDANCE */}
      {tab==="attendance" && (

        <div className="bg-white/10 p-6 rounded-xl">

          <h2 className="text-lg mb-4">Attendance</h2>

          <table className="w-full text-sm border border-white/10">

            <thead>
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Status</th>
              </tr>
            </thead>

            <tbody>

              {attendance.map(a=>(
                <tr key={a.id}>
                  <td className="p-2 border">{a.date}</td>
                  <td className="p-2 border">
                    {a.status === "present"
                      ? "✅ Present"
                      : "❌ Absent"}
                  </td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* PAYMENTS */}
      {tab==="payments" && (

        <div className="bg-white/10 p-6 rounded-xl">

          <h2 className="text-lg mb-4">Payments</h2>

          <table className="w-full text-sm border border-white/10">

            <thead>
              <tr>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Amount</th>
              </tr>
            </thead>

            <tbody>

              {payments.map(p=>(
                <tr key={p.id}>
                  <td className="p-2 border">{p.date}</td>
                  <td className="p-2 border">₹{p.amount}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

      )}

      {/* DOCUMENTS */}
      {tab==="documents" && (

        <div className="bg-white/10 p-6 rounded-xl">

          <h2 className="text-lg mb-4">Documents</h2>

          {documents.length === 0 && (
            <p className="text-gray-400">No documents uploaded</p>
          )}

          {documents.map(d=>(
            <a
              key={d.id}
              href={d.file_url}
              target="_blank"
              className="block text-blue-400 mb-2"
            >
              {d.document_type}
            </a>
          ))}

        </div>

      )}

      {/* REPORT CARDS */}
      {tab==="reportcards" && (

        <div className="bg-white/10 p-6 rounded-xl">

          <h2 className="text-lg mb-4">Report Cards</h2>

          <p className="text-gray-400">
            No report cards generated yet
          </p>

        </div>

      )}

    </div>
  )
}