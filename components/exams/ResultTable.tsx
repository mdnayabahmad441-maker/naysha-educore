import { ResultRow } from "@/types/result"

export default function ResultTable({ rows }:{rows:ResultRow[]}){

  return(

    <div className="overflow-x-auto">

    <table className="w-full text-sm border border-white/20">

      <thead>
        <tr>
          <th className="border p-2">Rank</th>
          <th className="border p-2">Student</th>
          <th className="border p-2">Total</th>
          <th className="border p-2">%</th>
          <th className="border p-2">Grade</th>
        </tr>
      </thead>

      <tbody>

      {rows.map((r)=>{

        let color="bg-green-700"

        if(r.percentage<40) color="bg-red-700"
        else if(r.percentage<60) color="bg-yellow-600"
        else if(r.percentage<80) color="bg-green-600"

        return(

          <tr key={r.student_id} className={color}>

            <td className="border p-2">{r.rank}</td>
            <td className="border p-2">{r.student_name}</td>
            <td className="border p-2">{r.total}</td>
            <td className="border p-2">{r.percentage.toFixed(2)}</td>
            <td className="border p-2">{r.grade}</td>

          </tr>

        )

      })}

      </tbody>

    </table>

    </div>

  )
}