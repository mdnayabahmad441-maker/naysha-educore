"use client"

import { useCallback, useEffect, useState } from "react"
import { getSchoolId } from "@/lib/school"
import { apiFetch } from "@/lib/api-client"
import { useSchool } from "@/context/SchoolContext"

type AdmissionEnquiry = {
  id: string
  student_name: string
  father_name: string
  class_wanted: string
  phone: string
  email: string
  address: string
  status: string
  created_at: string
}

export default function AdmissionEnquiryPage() {
  const school = useSchool()
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, { subject: string; message: string }>>({})
  const [draftingId, setDraftingId] = useState<string | null>(null)
  const [sendingReply, setSendingReply] = useState<Record<string, "email" | "whatsapp" | null>>({})
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  const fetchEnquiries = useCallback(async () => {
    if (!schoolId) return

    setLoading(true)
    try {
      const response = await apiFetch("/api/admission-enquiry")
      const data = await response.json()

      if (data.success) {
        setEnquiries(data.enquiries)
      } else {
        console.error("Failed to fetch enquiries:", data.error)
      }
    } catch (error) {
      console.error("Error fetching enquiries:", error)
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  useEffect(() => {
    fetchEnquiries()
  }, [fetchEnquiries])


  const updateStatus = async (enquiryId: string, newStatus: string) => {
    const previousEnquiries = enquiries

    setUpdatingStatusId(enquiryId)
    setEnquiries((prev) =>
      prev.map((enquiry) =>
        enquiry.id === enquiryId
          ? { ...enquiry, status: newStatus }
          : enquiry
      )
    )

    try {
      const response = await apiFetch("/api/admission-enquiry", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enquiryId,
          status: newStatus,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Failed to update status")
      }
    } catch (error) {
      console.error(error)
      setEnquiries(previousEnquiries)
      alert(error instanceof Error ? error.message : "Failed to update status")
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const generateReply = async (enquiry: AdmissionEnquiry) => {
    if (!schoolId) return

    try {
      setDraftingId(enquiry.id)

      const response = await apiFetch("/api/ai/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task: "enquiry_reply",
          schoolId,
          schoolName: school?.name || "School",
          studentName: enquiry.student_name,
          fatherName: enquiry.father_name,
          classWanted: enquiry.class_wanted,
          phone: enquiry.phone,
          email: enquiry.email,
          address: enquiry.address,
          status: enquiry.status
        })
      })

      const result = await response.json()
      if (!response.ok || !result?.data) {
        throw new Error(result?.error || "Failed to generate reply")
      }

      setReplyDrafts((current) => ({
        ...current,
        [enquiry.id]: result.data
      }))
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Failed to generate reply")
    } finally {
      setDraftingId(null)
    }
  }

  const sendDraftedReply = async (enquiry: AdmissionEnquiry, channel: "email" | "whatsapp") => {
    const draft = replyDrafts[enquiry.id]

    if (!draft) {
      alert("Generate the AI reply first")
      return
    }

    try {
      setSendingReply((current) => ({
        ...current,
        [enquiry.id]: channel
      }))

      if (channel === "email") {
        const response = await apiFetch("/api/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: enquiry.email,
            subject: draft.subject,
            message: draft.message
          })
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result?.error || "Failed to send email")
        }
      } else {
        const response = await apiFetch("/api/send-whatsapp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            phone: enquiry.phone,
            message: `${draft.subject}\n\n${draft.message}`
          })
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result?.error || "Failed to send WhatsApp")
        }
      }

      alert(`${channel === "email" ? "Email" : "WhatsApp"} reply sent successfully`)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : `Failed to send ${channel} reply`)
    } finally {
      setSendingReply((current) => ({
        ...current,
        [enquiry.id]: null
      }))
    }
  }

  return (
    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admission Enquiries</h1>
          <p className="text-sm text-gray-400 mt-2">
            {enquiries.length} enquiries received
          </p>
        </div>
        <button
          onClick={fetchEnquiries}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading enquiries...</p>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No enquiries yet</h3>
            <p className="text-gray-400">Admission enquiries will appear here when received.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/20">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Student</th>
                  <th className="p-4 text-left">Father</th>
                  <th className="p-4 text-left">Class</th>
                  <th className="p-4 text-left">Contact</th>
                  <th className="p-4 text-left">Address</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="p-4 text-gray-300">
                      {formatDate(enquiry.created_at)}
                    </td>
                    <td className="p-4 font-medium">
                      {enquiry.student_name}
                    </td>
                    <td className="p-4">
                      {enquiry.father_name}
                    </td>
                    <td className="p-4">
                      {enquiry.class_wanted}
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="text-sm">{enquiry.phone}</div>
                        <div className="text-xs text-gray-400">{enquiry.email}</div>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className="truncate text-sm" title={enquiry.address}>
                        {enquiry.address}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        enquiry.status === 'new'
                          ? 'bg-green-500/20 text-green-400'
                          : enquiry.status === 'contacted'
                          ? 'bg-blue-500/20 text-blue-400'
                          : enquiry.status === 'admitted'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {enquiry.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="space-y-3">
                        <select
                          value={enquiry.status}
                          onChange={(e) => updateStatus(enquiry.id, e.target.value)}
                          disabled={updatingStatusId === enquiry.id}
                          className="bg-slate-900/90 text-white border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option className="bg-slate-900 text-white" value="new">New</option>
                          <option className="bg-slate-900 text-white" value="contacted">Contacted</option>
                          <option className="bg-slate-900 text-white" value="admitted">Admitted</option>
                          <option className="bg-slate-900 text-white" value="rejected">Rejected</option>
                        </select>
                        <button
                          onClick={() => generateReply(enquiry)}
                          disabled={draftingId === enquiry.id}
                          className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                        >
                          {draftingId === enquiry.id ? "Drafting..." : "AI Reply"}
                        </button>
                        {replyDrafts[enquiry.id] && (
                          <div className="max-w-md rounded-lg border border-white/10 bg-slate-950/60 p-3 text-xs text-gray-200">
                            <p className="font-semibold text-white">{replyDrafts[enquiry.id].subject}</p>
                            <p className="mt-2 whitespace-pre-wrap">{replyDrafts[enquiry.id].message}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() => navigator.clipboard.writeText(`${replyDrafts[enquiry.id].subject}\n\n${replyDrafts[enquiry.id].message}`)}
                                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/10"
                              >
                                Copy Reply
                              </button>
                              <button
                                onClick={() => sendDraftedReply(enquiry, "email")}
                                className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/20"
                              >
                                {sendingReply[enquiry.id] === "email" ? "Sending Email..." : "Send Email"}
                              </button>
                              <button
                                onClick={() => sendDraftedReply(enquiry, "whatsapp")}
                                className="rounded-md border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-cyan-100 hover:bg-cyan-500/20"
                              >
                                {sendingReply[enquiry.id] === "whatsapp" ? "Sending WhatsApp..." : "Send WhatsApp"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
