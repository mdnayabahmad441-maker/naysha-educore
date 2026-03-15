import ExamCard from "@/components/ExamCard"

export default function ExamsDashboard() {
  const cards = [
    { title: "Create Exam", route: "/admin/exams/create" },
    { title: "Subjects", route: "/admin/exams/subjects" },
    { title: "Class Subjects", route: "/admin/exams/class-subjects" },
    { title: "Exam Subjects", route: "/admin/exams/exam-subjects" },
    { title: "Enter Marks", route: "/admin/exams/marks" },
    { title: "Results", route: "/admin/exams/results" },
    { title: "Report Cards", route: "/admin/exams/reportcards" },
    { title: "Analytics", route: "/admin/exams/analytics" }
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Exam Module</h1>

      <div className="grid grid-cols-4 gap-6">
        {cards.map((card) => (
          <ExamCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  )
}