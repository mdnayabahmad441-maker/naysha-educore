export type ResultRow = {
  student_id: string
  student_name: string
  total: number
  percentage: number
  rank: number
  grade: string
  marks: Record<string, number | string>
}