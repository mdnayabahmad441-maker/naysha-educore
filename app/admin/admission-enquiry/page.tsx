"use client"

import { useCallback, useEffect, useState } from "react"
import { getSchoolId } from "@/lib/school"
import { apiFetch } from "@/lib/api-client"

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
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [schoolId, setSchoolId] = useState<string | null>(null)

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
    // This would typically call an API to update the status
    // For now, we'll just update the local state
    setEnquiries(prev =>
      prev.map(enquiry =>
        enquiry.id === enquiryId
          ? { ...enquiry, status: newStatus }
          : enquiry
      )
    )
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
                      <select
                        value={enquiry.status}
                        onChange={(e) => updateStatus(enquiry.id, e.target.value)}
                        className="bg-slate-900/90 text-white border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option className="bg-slate-900 text-white" value="new">New</option>
                        <option className="bg-slate-900 text-white" value="contacted">Contacted</option>
                        <option className="bg-slate-900 text-white" value="admitted">Admitted</option>
                        <option className="bg-slate-900 text-white" value="rejected">Rejected</option>
                      </select>
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
