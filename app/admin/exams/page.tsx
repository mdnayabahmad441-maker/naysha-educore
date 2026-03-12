"use client"

import Link from "next/link"

export default function ExamsDashboard(){

  const cards = [
    {
      title: "Create Exam",
      href: "/admin/exams/create"
    },
    {
      title: "Enter Marks",
      href: "/admin/exams/marks"
    },
    {
      title: "Results",
      href: "/admin/exams/results"
    },
    {
      title: "Report Cards",
      href: "/admin/exams/reportcards"
    },
    {
      title: "Subjects",
      href: "/admin/subjects"
    }
  ]

  return(

    <div className="p-10 text-white">

      <h1 className="text-4xl font-bold mb-12">
        Exam Management
      </h1>

      <div
        className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-8
        "
      >

        {cards.map((card)=>(

          <Link
            key={card.href}
            href={card.href}
            className="
            bg-white/10
            hover:bg-white/20
            transition
            rounded-2xl
            p-10
            text-center
            text-lg
            font-semibold
            shadow-lg
            backdrop-blur-lg
            "
          >

            {card.title}

          </Link>

        ))}

      </div>

    </div>

  )

}