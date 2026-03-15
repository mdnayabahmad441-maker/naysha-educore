"use client"

export default function ReportCards(){

return(

<div className="p-10">

<button
onClick={()=>window.print()}
className="bg-blue-600 text-white px-4 py-2 rounded mb-6">
Print
</button>

<div className="border p-8 max-w-xl">

<h1 className="text-xl font-bold mb-4">
School Name
</h1>

<p>Student Name:</p>
<p>Class:</p>
<p>Exam:</p>

<table className="w-full border mt-6">

<thead>
<tr>
<th>Subject</th>
<th>Marks</th>
<th>Max</th>
</tr>
</thead>

<tbody>
</tbody>

</table>

<p className="mt-6">Total:</p>
<p>Percentage:</p>
<p>Rank:</p>
<p>Grade:</p>

</div>

</div>

)
}