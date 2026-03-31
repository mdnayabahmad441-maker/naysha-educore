"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ResultPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [exams, setExams] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [marksMap, setMarksMap] = useState<any>({})
  const [results, setResults] = useState<any[]>([])
  const [selectedExamId, setSelectedExamId] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<string>("rank")

  useEffect(() => {
    getSchoolId().then(setSchoolId)
  }, [])

  // LOAD EXAMS
  useEffect(() => {
    if (!schoolId) return

    const fetchExams = async () => {
      const { data } = await supabase
        .from("exams")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
      
      setExams(data || [])
    }
    
    fetchExams()
  }, [schoolId])

  const calculateGrade = (percentage: number): string => {
    if (percentage >= 90) return "A+"
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B+"
    if (percentage >= 60) return "B"
    if (percentage >= 50) return "C+"
    if (percentage >= 40) return "C"
    if (percentage >= 33) return "D"
    return "F"
  }

  // Sort results based on selected option
  const getSortedResults = () => {
    if (!results.length) return []
    
    const sorted = [...results]
    switch(sortBy) {
      case "name-asc":
        return sorted.sort((a, b) => {
          const studentA = students.find(s => s.id === a.student_id)
          const studentB = students.find(s => s.id === b.student_id)
          return (studentA?.name || "").localeCompare(studentB?.name || "")
        })
      case "name-desc":
        return sorted.sort((a, b) => {
          const studentA = students.find(s => s.id === a.student_id)
          const studentB = students.find(s => s.id === b.student_id)
          return (studentB?.name || "").localeCompare(studentA?.name || "")
        })
      case "percentage-high":
        return sorted.sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
      case "percentage-low":
        return sorted.sort((a, b) => (a.percentage || 0) - (b.percentage || 0))
      default: // rank
        return sorted.sort((a, b) => (a.rank || 0) - (b.rank || 0))
    }
  }

  const loadResult = async (examId: string) => {
    if (!examId) {
      setSelectedExamId("")
      setStudents([])
      setSubjects([])
      setMarksMap({})
      setResults([])
      return
    }
    
    setIsLoading(true)
    setSelectedExamId(examId)
    setError(null)

    try {
      const exam = exams.find(e => String(e.id) === String(examId))

      if (!exam) {
        setError("Exam not found")
        setIsLoading(false)
        return
      }

      if (exam.is_all_classes) {
        setError("This exam covers multiple classes. Please use the report card section for multi-class results.")
        setIsLoading(false)
        return
      }

      const class_id = exam.class_id

      // STUDENTS
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", class_id)
        .order("roll_number", { ascending: true })

      if (studentsError) throw studentsError
      setStudents(studentsData || [])

      // SUBJECTS
      const { data: subjectData, error: subjectError } = await supabase
        .from("exam_subjects")
        .select(`
          subject_id,
          subjects(name)
        `)
        .eq("exam_id", exam.id)

      if (subjectError) throw subjectError

      const formatted = subjectData?.map((s: any) => ({
        id: s.subject_id,
        name: s.subjects?.name
      })) || []
      
      setSubjects(formatted)

      // MARKS MAP
      const { data: marksData, error: marksError } = await supabase
        .from("marks")
        .select("*")
        .eq("exam_id", exam.id)

      if (marksError) throw marksError

      const map: any = {}
      marksData?.forEach((m: any) => {
        map[`${m.student_id}_${m.subject_id}`] = m.marks_obtained
      })
      setMarksMap(map)

      // RESULTS
      const { data: resultData, error: resultError } = await supabase
        .from("results")
        .select("*")
        .eq("exam_id", exam.id)

      if (resultError) throw resultError

      const sorted = (resultData || [])
        .sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0))
        .map((r: any, i: number) => ({
          ...r,
          rank: r.rank || i + 1,
          grade: r.grade || calculateGrade(Number(r.percentage || 0))
        }))

      setResults(sorted)
      
    } catch (err: any) {
      console.error("Error loading results:", err)
      setError(err.message || "Failed to load results. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getColor = (p: number) => {
    if (p < 33) return "bg-red-900/30"
    if (p < 60) return "bg-yellow-600/30"
    if (p < 80) return "bg-green-500/30"
    return "bg-green-800/30"
  }

  const getExamDisplayName = (exam: any) => {
    const classInfo = exam.class_id ? `Class ${exam.class_id}` : ""
    const date = exam.exam_date ? `· ${new Date(exam.exam_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ""
    return `${exam.name} ${classInfo} ${date}`.trim()
  }

  const displayedResults = getSortedResults()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Premium Header */}
      <div className="bg-gray-900/95 border-b border-gray-800 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Naysha EduCore
              </h1>
              <p className="text-sm text-gray-500 mt-1">Results Management System</p>
            </div>
            <div className="flex gap-6 text-gray-400">
              <span className="hover:text-white cursor-pointer transition">Dashboard</span>
              <span className="text-blue-400 border-b-2 border-blue-400 pb-1">Results</span>
              <span className="hover:text-white cursor-pointer transition">Students</span>
              <span className="hover:text-white cursor-pointer transition">Teachers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Exam Results</h2>
          <p className="text-gray-400">View, analyse and publish student results for any published exam</p>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Academic</h3>
              <div className="space-y-2">
                {["Students", "Teachers", "Attendance", "Timetable", "Exams"].map((item) => (
                  <div key={item} className="text-gray-300 hover:text-white hover:bg-gray-700/50 px-3 py-2 rounded-lg cursor-pointer transition">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Controls Card */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 mb-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">SELECT EXAM</label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose an exam —</option>
                    {exams.map(exam => (
                      <option key={exam.id} value={exam.id}>
                        {getExamDisplayName(exam)}
                      </option>
                    ))}
                  </select>
                  {exams.length === 0 && !isLoading && (
                    <p className="text-sm text-gray-500 mt-2">No published exams available</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">SORT BY</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="rank">Rank (Default)</option>
                    <option value="name-asc">Name A → Z</option>
                    <option value="name-desc">Name Z → A</option>
                    <option value="percentage-high">% High → Low</option>
                    <option value="percentage-low">% Low → High</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => loadResult(selectedExamId)}
                  disabled={!selectedExamId || isLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all"
                >
                  {isLoading ? "Loading..." : "Load Results"}
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-6 bg-red-900/50 border border-red-700 rounded-xl p-4">
                <p className="text-red-200">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-300 text-sm mt-2 hover:text-red-200"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-400">Loading results...</p>
              </div>
            )}

            {/* Results Table */}
            {!isLoading && selectedExamId && displayedResults.length > 0 && subjects.length > 0 && (
              <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900/80 border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Rank</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Roll No</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Student Name</th>
                        {subjects.map(s => (
                          <th key={s.id} className="px-4 py-3 text-left text-gray-300 font-semibold">{s.name}</th>
                        ))}
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Total</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">%</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedResults.map(r => {
                        const st = students.find(s => s.id === r.student_id)
                        const percentage = Number(r.percentage || 0)
                        
                        return (
                          <tr 
                            key={r.id} 
                            className={`${getColor(percentage)} border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors`}
                          >
                            <td className="px-4 py-3 font-bold text-gray-200">#{r.rank}</td>
                            <td className="px-4 py-3 text-gray-400">{st?.roll_number || "-"}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{st?.name || "Unknown"}</div>
                              {st?.father_name && (
                                <div className="text-xs text-gray-500">{st.father_name}</div>
                              )}
                            </td>
                            {subjects.map(sub => (
                              <td key={sub.id} className="px-4 py-3 text-gray-300">
                                {marksMap[`${st?.id}_${sub.id}`] !== undefined 
                                  ? marksMap[`${st?.id}_${sub.id}`] 
                                  : "-"}
                              </td>
                            ))}
                            <td className="px-4 py-3 font-medium text-gray-200">{r.total}</td>
                            <td className={`px-4 py-3 font-semibold ${
                              percentage < 33 ? "text-red-400" :
                              percentage < 60 ? "text-yellow-400" :
                              percentage < 80 ? "text-green-400" :
                              "text-green-300"
                            }`}>
                              {percentage.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                                percentage >= 90 ? "bg-yellow-500/20 text-yellow-400" :
                                percentage >= 75 ? "bg-green-500/20 text-green-400" :
                                percentage >= 60 ? "bg-blue-500/20 text-blue-400" :
                                percentage >= 45 ? "bg-purple-500/20 text-purple-400" :
                                percentage >= 33 ? "bg-orange-500/20 text-orange-400" :
                                "bg-red-500/20 text-red-400"
                              }`}>
                                {r.grade}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No Exam Selected Message */}
            {!isLoading && (!selectedExamId || displayedResults.length === 0) && !error && (
              <div className="bg-gray-800/50 rounded-xl p-12 text-center border border-gray-700">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-400 text-lg mb-2">No exam selected</p>
                <p className="text-gray-500 text-sm">
                  Select a published exam from the dropdown above and click "Load Results" to view the result sheet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>© 2024 Naysha EduCore. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
              <span className="hover:text-gray-300 cursor-pointer">Notice Board</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 text-center mt-4">
            Claude is AI and can make mistakes. Please double-check responses.
          </p>
        </div>
      </footer>
    </div>
  )
}