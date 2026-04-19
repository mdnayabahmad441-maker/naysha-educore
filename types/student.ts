export type StudentRecord = {
  id: string
  school_id: string
  name: string
  email: string | null
  photo: string | null
  student_code: string | null
  class_id: string | null
  roll_number: number | null
}

export type ParentRecord = {
  id: string
  school_id: string
  student_id: string
  name: string | null
  father_name: string | null
  mother_name: string | null
  email: string | null
  phone: string | null
}

export type StudentEnrollmentRecord = {
  id: string
  student_id: string
  school_id: string
  academic_year_id: string
  class_id: string | null
  roll_number: number | null
}
