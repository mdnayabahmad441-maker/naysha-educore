"use client"

export default function Page(){

return(

<div className="p-10 text-white">

<button
onClick={()=>window.print()}
className="bg-blue-600 px-4 py-2 rounded mb-6"
>

Print

</button>

<div className="bg-white text-black p-10 max-w-xl">

<h1 className="text-xl mb-4">NaySha School</h1>

<p>Student:</p>
<p>Class:</p>
<p>Exam:</p>

<table className="w-full border mt-4">

<thead>

<tr>

<th>Subject</th>
<th>Marks</th>
<th>Max</th>

</tr>

</thead>

</table>

</div>

</div>

)
}