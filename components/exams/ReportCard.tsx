"use client"

interface Props {
  student: any
  report: any
  school: any
  exam: any
  classData: any
  templateUrl?: string | null
}

export default function ReportCard({
  student,
  report,
  school,
  exam,
  classData,
  templateUrl
}: Props) {
  if (!report) return null

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white text-black shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
        {templateUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={templateUrl}
            alt="Report card template"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}

        <div className={`absolute inset-0 ${templateUrl ? "bg-white/70" : "bg-white"}`} />

        <div className="relative space-y-6 p-8">
          <div className="text-center space-y-2">
            {school?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={school.logo_url}
                alt="logo"
                className="mx-auto h-16 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-slate-900">{school?.name}</h1>
            <p className="text-sm text-slate-700">Student Performance Report</p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-white/80 p-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-semibold text-slate-700">Name:</span> {student?.name}</p>
              <p><span className="font-semibold text-slate-700">Class:</span> {classData?.name}</p>
              <p><span className="font-semibold text-slate-700">Roll No:</span> {student?.roll_number || "-"}</p>
              <p><span className="font-semibold text-slate-700">Father Name:</span> {student?.father_name || "-"}</p>
            </div>

            <div className="space-y-2 text-right">
              <p><span className="font-semibold text-slate-700">Exam:</span> {exam?.name}</p>
              <p><span className="font-semibold text-slate-700">Rank:</span> {report?.rank || "-"}</p>
              <p><span className="font-semibold text-slate-700">Grade:</span> {report.grade}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white/85">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3 text-left">Subject</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Passing</th>
                  <th className="p-3">Obtained</th>
                  <th className="p-3">Result</th>
                </tr>
              </thead>

              <tbody>
                {report.rows.map((r: any, i: number) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="p-3">{r.name}</td>
                    <td className="p-3 text-center">{r.total}</td>
                    <td className="p-3 text-center">{r.passing}</td>
                    <td className="p-3 text-center">{r.obtained}</td>
                    <td className={`p-3 text-center font-semibold ${r.status === "FAIL" ? "text-red-600" : "text-emerald-700"}`}>
                      {r.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm">
              <p>Total Marks: {report.totalMarks}</p>
              <p>Obtained: {report.obtainedMarks}</p>
              <p>Percentage: {report.percentage.toFixed(2)}%</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-right">
              <p className={`text-2xl font-bold ${report.finalResult === "FAIL" ? "text-red-600" : "text-emerald-700"}`}>
                {report.finalResult}
              </p>
              <p className="mt-2 text-lg font-semibold text-amber-700">Grade: {report.grade}</p>
            </div>
          </div>

          <div className="w-fit rounded-lg border border-slate-200 bg-white/80 p-4 text-xs text-slate-700">
            <p className="mb-2 font-semibold">Grade Scale</p>
            <p>A+ ≥ 90</p>
            <p>A ≥ 75</p>
            <p>B ≥ 60</p>
            <p>C ≥ 50</p>
            <p>D ≥ 33</p>
            <p>F &lt; 33</p>
          </div>

          <div className="flex justify-between pt-10 text-sm text-slate-700">
            <p>Class Teacher</p>
            <p>Principal</p>
          </div>
        </div>
      </div>
    </div>
  )
}
