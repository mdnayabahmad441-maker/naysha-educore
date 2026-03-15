export type Student = {
  id: string
  name: string
  class: string
  roll_no: number
}

export type Subject = {
  id: string
  name: string
}

export type Exam = {
  id: string
  name: string
  term: string
  date: string
}

export type Mark = {
  student_id: string
  subject_id: string
  marks: number | string
}