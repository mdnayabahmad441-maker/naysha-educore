import Card from "@/components/ui/Card"
import StudentForm from "@/components/students/StudentForm"

export default function AddStudent(){

  return(

    <div>

      <h1 className="text-2xl mb-6">Add Student</h1>

      <Card>
        <StudentForm/>
      </Card>

    </div>

  )
}