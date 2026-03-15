export type Exam = {
  id: string
  school_id: string
  name: string
  class_id: string
  created_at?: string
}

export type ExamSubject = {
  id: string
  exam_id: string
  subject_id: string
  max_marks: number
}