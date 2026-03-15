"use client"

import { useRouter } from "next/navigation"

type Props = {
  title: string
  route: string
}

export default function ExamCard({ title, route }: Props) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(route)}
      className="bg-white border rounded-xl p-6 shadow hover:shadow-lg cursor-pointer transition"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  )
}