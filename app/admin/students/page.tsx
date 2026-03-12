"use client"

import { useState,useEffect,useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function StudentsPage(){

const router = useRouter()

const [name,setName] = useState("")
const [className,setClassName] = useState("")
const [roll,setRoll] = useState("")
const [phone,setPhone] = useState("")

const [students,setStudents] = useState<any[]>([])
const [schoolId,setSchoolId] = useState<string | null>(null)

const [editId,setEditId] = useState<string | null>(null)

const [selectedIndex,setSelectedIndex] = useState(0)

const rowsRef = useRef<(HTMLTableRowElement | null)[]>([])



/* ---------------- GET SCHOOL ---------------- */

useEffect(()=>{
getSchool()
},[])

async function getSchool(){

const { data:userData } = await supabase.auth.getUser()

const userId = userData.user?.id

if(!userId) return

const { data } = await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(data){

setSchoolId(data.school_id)

fetchStudents(data.school_id)

}

}



/* ---------------- FETCH STUDENTS ---------------- */

async function fetchStudents(id:string){

const { data,error } = await supabase
.from("students")
.select("*")
.eq("school_id",id)
.order("class",{ascending:true})

if(error){

console.log(error)

return

}

if(data){

setStudents(data)

}

}



/* ---------------- ADD STUDENT ---------------- */

async function addStudent(){

if(!name || !className || !roll){

alert("Fill required fields")

return

}

if(!schoolId){

alert("School not found")

return

}

const { error } = await supabase
.from("students")
.insert({

name,
class:className,
roll_number:roll,
parent_phone:phone,
school_id:schoolId

})

if(error){

alert(error.message)

return

}

setName("")
setClassName("")
setRoll("")
setPhone("")

fetchStudents(schoolId)

}



/* ---------------- DELETE STUDENT ---------------- */

async function deleteStudent(id:string){

const confirmDelete = confirm("Delete this student?")

if(!confirmDelete) return

const { error } = await supabase
.from("students")
.delete()
.eq("id",id)
.eq("school_id",schoolId)

if(error){

alert(error.message)

console.log(error)

return

}

/* instant UI update */

setStudents(prev=>prev.filter(s=>s.id!==id))

}



/* ---------------- EDIT STUDENT ---------------- */

function startEdit(student:any){

setEditId(student.id)

setName(student.name)
setClassName(student.class)
setRoll(student.roll_number)
setPhone(student.parent_phone)

}



/* ---------------- UPDATE STUDENT ---------------- */

async function updateStudent(){

if(!editId) return

const { error } = await supabase
.from("students")
.update({

name,
class:className,
roll_number:roll,
parent_phone:phone

})
.eq("id",editId)
.eq("school_id",schoolId)

if(error){

alert(error.message)

return

}

setEditId(null)

setName("")
setClassName("")
setRoll("")
setPhone("")

fetchStudents(schoolId!)

}



/* ---------------- KEYBOARD NAVIGATION ---------------- */

useEffect(()=>{

function handleKeys(e:KeyboardEvent){

if(e.key==="ArrowDown"){

setSelectedIndex(prev=>Math.min(prev+1,students.length-1))

}

if(e.key==="ArrowUp"){

setSelectedIndex(prev=>Math.max(prev-1,0))

}

if(e.key==="Enter"){

const student = students[selectedIndex]

if(student){

router.push(`/admin/students/${student.id}`)

}

}

}

window.addEventListener("keydown",handleKeys)

return ()=>window.removeEventListener("keydown",handleKeys)

},[students,selectedIndex])



/* ---------------- GROUP CLASSES ---------------- */

const classes = [...new Set(students.map((s:any)=>s.class))]



return(

<div className="p-4 md:p-8">

<h1 className="text-2xl md:text-3xl font-bold mb-8">

Students

</h1>



{/* ADD / EDIT STUDENT FORM */}

<div className="bg-white/10 p-6 rounded-xl w-full md:w-[380px] mb-10">

<h2 className="text-lg font-bold mb-4">

{editId ? "Edit Student" : "Add Student"}

</h2>

<input
placeholder="Student Name"
className="w-full p-2 mb-3 rounded bg-slate-800"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<input
placeholder="Class"
className="w-full p-2 mb-3 rounded bg-slate-800"
value={className}
onChange={(e)=>setClassName(e.target.value)}
/>

<input
placeholder="Roll Number"
className="w-full p-2 mb-3 rounded bg-slate-800"
value={roll}
onChange={(e)=>setRoll(e.target.value)}
/>

<input
placeholder="Parent Phone"
className="w-full p-2 mb-4 rounded bg-slate-800"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
/>

<button
onClick={editId ? updateStudent : addStudent}
className="w-full py-2 rounded bg-gradient-to-r from-cyan-500 to-purple-600"
>

{editId ? "Update Student" : "Add Student"}

</button>

</div>



{/* CLASS SECTIONS */}

{classes.map((cls:any)=>{

const classStudents = students.filter((s:any)=>s.class === cls)

return(

<div key={cls} className="bg-white/10 p-4 md:p-6 rounded-xl mb-8 overflow-x-auto">

<div className="flex justify-between items-center mb-4">

<h2 className="text-lg md:text-xl font-bold">

Class {cls}

</h2>

<button
onClick={()=>setClassName(cls)}
className="px-4 py-1 text-sm rounded bg-green-600 hover:bg-green-700"
>

Add Student

</button>

</div>



<table className="w-full text-sm md:text-base">

<thead>

<tr className="border-b border-white/20">

<th className="text-left py-2">Name</th>
<th>Roll</th>
<th>Phone</th>
<th>Actions</th>

</tr>

</thead>



<tbody>

{classStudents.map((s:any)=>{

const globalIndex = students.findIndex((x:any)=>x.id===s.id)

return(

<tr
key={s.id}
ref={(el)=>{rowsRef.current[globalIndex]=el}}
className={`border-b border-white/10 cursor-pointer hover:bg-white/10 ${
selectedIndex===globalIndex ? "bg-purple-700/40" : ""
}`}
onClick={()=>router.push(`/admin/students/${s.id}`)}
>

<td className="py-2">{s.name}</td>

<td>{s.roll_number}</td>

<td>{s.parent_phone}</td>

<td>

<div className="flex gap-2">

<button
onClick={(e)=>{
e.stopPropagation()
startEdit(s)
}}
className="px-3 py-1 text-sm bg-blue-500 rounded hover:bg-blue-600"
>

Edit

</button>

<button
onClick={(e)=>{
e.stopPropagation()
deleteStudent(s.id)
}}
className="px-3 py-1 text-sm bg-red-600 rounded hover:bg-red-700"
>

Delete

</button>

</div>

</td>

</tr>

)

})}

</tbody>

</table>

</div>

)

})}

</div>

)

}