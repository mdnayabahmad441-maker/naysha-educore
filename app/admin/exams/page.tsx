import Card from "@/components/ui/Card"
import Link from "next/link"
import Button from "@/components/ui/Button"

export default function ExamsPage(){

  return(

    <div className="space-y-6">

      <div className="flex justify-between">
        <h1 className="text-2xl">Exams</h1>

        <Link href="/admin/exams/create">
          <Button color="purple">Create Exam</Button>
        </Link>
      </div>

      <Card>
        Exam list will appear here.
      </Card>

    </div>

  )
}