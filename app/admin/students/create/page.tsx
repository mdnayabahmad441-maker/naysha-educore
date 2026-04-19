import StudentForm from "@/components/students/StudentForm"
import Card from "@/components/ui/Card"

export default function CreateStudentPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl">Create Student</h1>

      <Card>
        <StudentForm />
      </Card>
    </div>
  )
}
