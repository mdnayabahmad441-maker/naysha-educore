"use client"

interface Props {
  student: any
  report: any
  school: any
  exam: any
  classData: any
}

export default function ReportCard({
  student,
  report,
  school,
  exam,
  classData
}: Props) {

  if (!report) return null

  return (
    <div
      id="report-card"
      className="w-full max-w-4xl mx-auto bg-[#0f172a] text-white border border-emerald-500 rounded-xl p-8 space-y-6"
    >

      {/* HEADER */}
      <div className="text-center space-y-2">
        {school?.logo_url && (
          <img
            src={school.logo_url}
            alt="logo"
            className="h-16 mx-auto object-contain"
          />
        )}
        <h1 className="text-2xl font-bold text-emerald-400">
          {school?.name}
        </h1>
        <p className="text-sm text-gray-400">
          Student Performance Report
        </p>
      </div>

      {/* STUDENT INFO */}
      <div className="grid grid-cols-2 gap-4 text-sm">

        <div className="space-y-2">
          <p><span className="text-emerald-400">Name:</span> {student?.name}</p>
          <p><span className="text-emerald-400">Class:</span> {classData?.name}</p>
          <p><span className="text-emerald-400">Roll No:</span> {student?.roll_number || "-"}</p>
          <p><span className="text-emerald-400">Father Name:</span> {student?.father_name || "-"}</p>
        </div>

        <div className="space-y-2 text-right">
          <p><span className="text-emerald-400">Exam:</span> {exam?.name}</p>
          <p><span className="text-emerald-400">Rank:</span> {report?.rank}</p>
        </div>

      </div>

      {/* SUBJECT TABLE */}
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <table className="w-full text-sm">

          <thead className="bg-[#020617] text-gray-300">
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
              <tr
                key={i}
                className="border-t border-gray-800 hover:bg-[#020617]"
              >
                <td className="p-3">{r.name}</td>
                <td className="p-3 text-center">{r.total}</td>
                <td className="p-3 text-center">{r.passing}</td>
                <td className="p-3 text-center">{r.obtained}</td>
                <td
                  className={`p-3 text-center font-semibold ${
                    r.status === "FAIL"
                      ? "text-red-400"
                      : "text-emerald-400"
                  }`}
                >
                  {r.status}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* SUMMARY + RESULT */}
      <div className="flex justify-between items-start">

        {/* LEFT */}
        <div className="space-y-1 text-sm">
          <p>Total Marks: {report.totalMarks}</p>
          <p>Obtained: {report.obtainedMarks}</p>
          <p>Percentage: {report.percentage.toFixed(2)}%</p>
        </div>

        {/* RIGHT */}
        <div className="text-right space-y-2">
          <p
            className={`text-2xl font-bold ${
              report.finalResult === "FAIL"
                ? "text-red-400"
                : "text-emerald-400"
            }`}
          >
            {report.finalResult}
          </p>

          <p className="text-lg text-yellow-400">
            Grade: {report.grade}
          </p>
        </div>

      </div>

      {/* GRADE SCALE */}
      <div className="border border-gray-700 rounded-lg p-4 text-xs text-gray-300 w-fit">
        <p className="font-semibold mb-2">Grade Scale</p>
        <p>A+ ≥ 90</p>
        <p>A ≥ 75</p>
        <p>B ≥ 60</p>
        <p>C ≥ 50</p>
        <p>D ≥ 33</p>
        <p>F &lt; 33</p>
      </div>

      {/* SIGNATURE */}
      <div className="flex justify-between pt-10 text-sm text-gray-400">
        <p>Class Teacher</p>
        <p>Principal</p>
      </div>

    </div>
  )
}