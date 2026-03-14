"use client"

interface Props{
columns:string[]
data:any[]
renderActions?:(row:any)=>React.ReactNode
onRowClick?:(row:any)=>void
}

export default function ResponsiveTable({
columns,
data,
renderActions,
onRowClick
}:Props){

return(

<div className="w-full">

{/* DESKTOP TABLE */}

<div className="hidden md:block overflow-x-auto">

<table className="w-full text-left">

<thead className="border-b border-white/20">

<tr>

{columns.map((col)=>(
<th key={col} className="py-2">{col}</th>
))}

{renderActions && <th>Actions</th>}

</tr>

</thead>

<tbody>

{data.map((row:any)=>(
<tr
key={row.id}
className="border-b border-white/10 hover:bg-white/10 cursor-pointer"
onClick={()=>onRowClick?.(row)}
>

{columns.map((col)=>{

const key = col.toLowerCase().replace(" ","_")

return(
<td key={key} className="py-2">
{row[key]}
</td>
)

})}

{renderActions && (

<td onClick={(e)=>e.stopPropagation()}>
{renderActions(row)}
</td>

)}

</tr>
))}

</tbody>

</table>

</div>



{/* MOBILE CARDS */}

<div className="md:hidden space-y-4">

{data.map((row:any)=>(

<div
key={row.id}
className="bg-white/10 p-4 rounded-lg"
onClick={()=>onRowClick?.(row)}
>

{columns.map((col)=>{

const key = col.toLowerCase().replace(" ","_")

return(

<div key={key} className="flex justify-between text-sm mb-2">

<span className="text-gray-400">{col}</span>

<span>{row[key]}</span>

</div>

)

})}

{renderActions && (

<div className="flex gap-2 mt-3">

{renderActions(row)}

</div>

)}

</div>

))}

</div>

</div>

)

}