import Card from "@/components/ui/Card"

export default function DashboardPage() {

  return (

    <div className="grid grid-cols-4 gap-6">

      <Card>
        <h2 className="text-lg">Students</h2>
        <p className="text-3xl mt-2">120</p>
      </Card>

      <Card>
        <h2 className="text-lg">Teachers</h2>
        <p className="text-3xl mt-2">12</p>
      </Card>

      <Card>
        <h2 className="text-lg">Classes</h2>
        <p className="text-3xl mt-2">8</p>
      </Card>

      <Card>
        <h2 className="text-lg">Attendance</h2>
        <p className="text-3xl mt-2">92%</p>
      </Card>

    </div>

  )
}