"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

// Type definitions
interface Exam {
  id: string
  name: string
  class_id: string
  is_all_classes: boolean
  is_published: boolean
  exam_date?: string
  term?: string
}

interface Student {
  id: string
  name: string
  class_id: string
  roll_number?: string
  father_name?: string
}

interface Subject {
  id: string
  name: string
  code?: string
}

interface Mark {
  student_id: string
  subject_id: string
  marks_obtained: number
}

interface Result {
  id: string
  student_id: string
  exam_id: string
  total: number
  percentage: number
  grade: string
  rank: number
  remarks?: string
}

export default function ResultPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [marksMap, setMarksMap] = useState<Record<string, number>>({})
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingResults, setLoadingResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [examDetails, setExamDetails] = useState<Exam | null>(null)

  // Fetch school ID
  useEffect(() => {
    const fetchSchoolId = async () => {
      try {
        const id = await getSchoolId()
        setSchoolId(id)
      } catch (err) {
        console.error("Error fetching school ID:", err)
        setError("Failed to fetch school information")
      }
    }
    fetchSchoolId()
  }, [])

  // Fetch published exams
  useEffect(() => {
    if (!schoolId) return

    const fetchExams = async () => {
      try {
        setLoading(true)
        const { data, error: err } = await supabase
          .from("exams")
          .select("*")
          .eq("school_id", schoolId)
          .eq("is_published", true)
          .order("created_at", { ascending: false })

        if (err) throw err
        setExams(data || [])
      } catch (err: any) {
        console.error("Error fetching exams:", err)
        setError(err.message || "Failed to load exams")
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [schoolId])

  // Load result data when exam is selected
  const loadResult = async (examId: string) => {
    if (!examId) {
      resetState()
      return
    }

    setLoadingResults(true)
    setError(null)

    try {
      const exam = exams.find(e => String(e.id) === String(examId))
      if (!exam) {
        throw new Error("Exam not found")
      }
      setExamDetails(exam)

      // Check if exam is for all classes
      if (exam.is_all_classes) {
        setError("This exam covers multiple classes. Please use the report card section.")
        resetState()
        return
      }

      const classId = exam.class_id

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*")
        .eq("class_id", classId)
        .order("roll_number", { ascending: true })

      if (studentsError) throw studentsError
      setStudents(studentsData || [])

      // Fetch subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from("exam_subjects")
        .select(`
          subject_id,
          max_marks,
          subjects (
            id,
            name,
            code
          )
        `)
        .eq("exam_id", exam.id)

      if (subjectError) throw subjectError

      const formattedSubjects: Subject[] = (subjectData || [])
        .map((s: any) => ({
          id: s.subject_id,
          name: s.subjects?.name || "Unknown",
          code: s.subjects?.code
        }))
        .filter(s => s.id)

      setSubjects(formattedSubjects)

      // Fetch marks
      const { data: marksData, error: marksError } = await supabase
        .from("marks")
        .select("*")
        .eq("exam_id", exam.id)

      if (marksError) throw marksError

      const map: Record<string, number> = {}
      ;(marksData || []).forEach((m: Mark) => {
        map[`${m.student_id}_${m.subject_id}`] = m.marks_obtained
      })
      setMarksMap(map)

      // Fetch results
      const { data: resultData, error: resultError } = await supabase
        .from("results")
        .select("*")
        .eq("exam_id", exam.id)

      if (resultError) throw resultError

      // Sort and add ranks if needed
      const sortedResults = [...(resultData || [])].sort(
        (a, b) => (b.percentage || 0) - (a.percentage || 0)
      )

      const resultsWithRank = sortedResults.map((r, i) => ({
        ...r,
        rank: r.rank || i + 1
      }))

      setResults(resultsWithRank)

    } catch (err: any) {
      console.error("Error loading results:", err)
      setError(err.message || "Failed to load exam results")
      resetState()
    } finally {
      setLoadingResults(false)
    }
  }

  const resetState = () => {
    setStudents([])
    setSubjects([])
    setMarksMap({})
    setResults([])
    setExamDetails(null)
  }

  const handleExamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const examId = e.target.value
    setSelectedExam(examId)
    loadResult(examId)
  }

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return "A+"
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B+"
    if (percentage >= 60) return "B"
    if (percentage >= 50) return "C+"
    if (percentage >= 40) return "C"
    if (percentage >= 33) return "D"
    return "F"
  }

  const getRowColor = (percentage: number): string => {
    if (percentage < 33) return "bg-red-900/20"
    if (percentage < 60) return "bg-yellow-600/20"
    if (percentage < 80) return "bg-green-500/20"
    return "bg-green-800/20"
  }

  const getPercentageColor = (percentage: number): string => {
    if (percentage < 33) return "text-red-400 font-bold"
    if (percentage < 60) return "text-yellow-400 font-semibold"
    if (percentage < 80) return "text-green-400"
    return "text-green-300"
  }

  const calculateStatistics = () => {
    if (!results.length) return null
    
    const percentages = results.map(r => r.percentage)
    const average = percentages.reduce((a, b) => a + b, 0) / percentages.length
    const highest = Math.max(...percentages)
    const lowest = Math.min(...percentages)
    const passed = results.filter(r => r.percentage >= 33).length
    const passPercentage = (passed / results.length) * 100
    
    return { average, highest, lowest, passed, passPercentage, total: results.length }
  }

  const stats = calculateStatistics()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading exams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Exam Results</h1>
          <p className="text-gray-400">View and analyze student performance</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-lg">⚠️</span>
              <div className="flex-1">
                <p className="text-red-200">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={handleExamChange}
                className="w-full md:w-96 p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose an exam --</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name} {exam.term ? `(${exam.term})` : ""}
                  </option>
                ))}
              </select>
              {exams.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No published exams available</p>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-sm text-gray-400">Average Score</p>
              <p className="text-2xl font-bold text-white">{stats.average.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-sm text-gray-400">Highest Score</p>
              <p className="text-2xl font-bold text-green-400">{stats.highest.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-sm text-gray-400">Lowest Score</p>
              <p className="text-2xl font-bold text-red-400">{stats.lowest.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-sm text-gray-400">Pass Percentage</p>
              <p className="text-2xl font-bold text-blue-400">{stats.passPercentage.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">{stats.passed} / {stats.total} students</p>
            </div>
          </div>
        )}

        {/* Results Table */}
        {loadingResults ? (
          <div className="flex items-center justify-center py-20 bg-gray-800 rounded-xl">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading results...</p>
            </div>
          </div>
        ) : results.length > 0 ? (
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-300">Rank</th>
                    <th className="px-4 py-3 text-left text-gray-300">Roll No</th>
                    <th className="px-4 py-3 text-left text-gray-300">Student Name</th>
                    {subjects.map(subject => (
                      <th key={subject.id} className="px-4 py-3 text-left text-gray-300">
                        {subject.name}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-gray-300">Total</th>
                    <th className="px-4 py-3 text-left text-gray-300">%</th>
                    <th className="px-4 py-3 text-left text-gray-300">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(result => {
                    const student = students.find(s => s.id === result.student_id)
                    const percentage = Number(result.percentage || 0)
                    
                    return (
                      <tr
                        key={result.id}
                        className={`${getRowColor(percentage)} border-b border-gray-700`}
                      >
                        <td className="px-4 py-3 font-bold text-gray-300">
                          #{result.rank}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {student?.roll_number || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{student?.name || "Unknown"}</div>
                          {student?.father_name && (
                            <div className="text-xs text-gray-500">{student.father_name}</div>
                          )}
                        </td>
                        {subjects.map(subject => {
                          const markValue = marksMap[`${student?.id}_${subject.id}`]
                          return (
                            <td key={subject.id} className="px-4 py-3 text-gray-300">
                              {markValue !== undefined ? markValue : "-"}
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-gray-300 font-medium">
                          {result.total}
                        </td>
                        <td className={`px-4 py-3 ${getPercentageColor(percentage)}`}>
                          {percentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            percentage >= 90 ? "bg-yellow-500/20 text-yellow-400" :
                            percentage >= 75 ? "bg-green-500/20 text-green-400" :
                            percentage >= 60 ? "bg-blue-500/20 text-blue-400" :
                            percentage >= 45 ? "bg-purple-500/20 text-purple-400" :
                            percentage >= 33 ? "bg-orange-500/20 text-orange-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>
                            {result.grade || getGrade(percentage)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedExam ? (
          <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
            <p className="text-gray-400">No results found for this exam</p>
            <p className="text-sm text-gray-500 mt-2">Results may not have been published yet</p>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
            <p className="text-gray-400">Select an exam to view results</p>
          </div>
        )}
      </div>
    </div>
  )
}