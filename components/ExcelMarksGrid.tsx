"use client"

import { useState } from "react"

type Props = {
students:any[]
subjects:any[]
}

export default function ExcelMarksGrid({students,subjects}:Props){

const [data,setData]=useState<Record<string,string>>({})

function handleChange(student:string,subject:string,value:string){

if(value==="A"||value==="L"||/^\d+$/.test(value)){

setData(prev=>({
...prev,
[`${student}-${subject}`]:value
}))

}

}

return(

<table className="border w-full text-sm">

<thead>

<tr className="bg-gray-100">

<th className="p-2 border">Student</th>

{subjects.map((s)=>(
<th key={s.id} className="border p-2">{s.name}</th>
))}

<th className="border p-2">Total</th>
<th className="border p-2">%</th>

</tr>

</thead>

<tbody>

{students.map((student)=>{

let total=0

subjects.forEach((s)=>{
const val=data[`${student.id}-${s.id}`]
if(Number(val)) total+=Number(val)
})

const percent=(total/(subjects.length*100))*100

return(

<tr key={student.id}>

<td className="border p-2">{student.name}</td>

{subjects.map((s)=>{

const key=`${student.id}-${s.id}`

return(

<td key={s.id} className="border">

<input
value={data[key]||""}
onChange={(e)=>handleChange(student.id,s.id,e.target.value)}
className="w-full p-1 outline-none"
/>

</td>

)

})}

<td className="border text-center">{total}</td>
<td className="border text-center">{percent.toFixed(2)}</td>

</tr>

)

})}

</tbody>

</table>

)
}