"use client"

export default function CrudTable({ data, columns }: any) {

  return (
    <table style={{ width: "100%", marginTop: 20 }}>
      <thead>
        <tr>
          {columns.map((c: any) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>

      <tbody>
        {data.map((row: any, i: number) => (
          <tr key={i}>
            {columns.map((c: any) => (
              <td key={c}>{row[c]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}