"use client"

import Button from "@/components/ui/Button"

export default function ReportCard({ student, results }:any){

  const print = ()=> window.print()

  return(

    <div className="bg-white text-black p-10">

      <h1 className="text-2xl mb-4">Report Card</h1>

      <p><b>Student:</b> {student.name}</p>

      <table className="w-full border mt-6">

        <thead>
          <tr>
            <th className="border p-2">Total</th>
            <th className="border p-2">Percentage</th>
            <th className="border p-2">Rank</th>
            <th className="border p-2">Grade</th>
          </tr>
        </thead>

        <tbody>

          <tr>
            <td className="border p-2">{results.total}</td>
            <td className="border p-2">{results.percentage}</td>
            <td className="border p-2">{results.rank}</td>
            <td className="border p-2">{results.grade}</td>
          </tr>

        </tbody>

      </table>

      <div className="mt-6">
        <Button color="blue" onClick={print}>
          Print
        </Button>
      </div>

    </div>

  )
}