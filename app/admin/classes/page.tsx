"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useSchool } from "@/hooks/useSchool"

export default function ClassesPage(){

const { user } = useAuth()
const schoolId = useSchool(user?.id)

const [classes,setClasses] = useState<any[]>([])
const [sections,setSections] = useState<any[]>([])

const [className,setClassName] = useState("")
const [sectionName,setSectionName] = useState("")
const [selectedClass,setSelectedClass] = useState("")

/* LOAD DATA */

const loadData = async()=>{

if(!schoolId) return

const { data:classData } = await supabase
.from("classes")
.select("*")
.eq("school_id",schoolId)

setClasses(classData || [])

const { data:sectionData } = await supabase
.from("sections")
.select("*")
.eq("school_id",schoolId)

setSections(sectionData || [])

}

/* LOAD WHEN SCHOOL READY */

useEffect(()=>{

if(!schoolId) return

loadData()

},[schoolId])

/* CREATE CLASS */

const addClass = async()=>{

if(!className || !schoolId) return

await supabase
.from("classes")
.insert({
id:crypto.randomUUID(),
school_id:schoolId,
name:className
})

setClassName("")
loadData()

}

/* CREATE SECTION */

const addSection = async()=>{

if(!sectionName || !selectedClass || !schoolId) return

await supabase
.from("sections")
.insert({
id:crypto.randomUUID(),
school_id:schoolId,
class_id:selectedClass,
name:sectionName
})

setSectionName("")
loadData()

}

return(

<div className="space-y-6">

<h1 className="text-2xl">
Classes & Sections
</h1>

<Card>

{/* ADD CLASS */}

<div className="flex flex-wrap gap-4 mb-6">

<Input
placeholder="Class Name"
value={className}
onChange={(e)=>setClassName(e.target.value)}
/>

<Button color="green" onClick={addClass}>
Add Class
</Button>

</div>


{/* ADD SECTION */}

<div className="flex flex-wrap gap-4 mb-6">

<select
className="bg-white/10 border border-white/20 p-2 rounded"
value={selectedClass}
onChange={(e)=>setSelectedClass(e.target.value)}
>

<option value="">
Select Class
</option>

{classes.map((c)=>(
<option key={c.id} value={c.id}>
{c.name}
</option>
))}

</select>

<Input
placeholder="Section Name (A,B,C)"
value={sectionName}
onChange={(e)=>setSectionName(e.target.value)}
/>

<Button color="green" onClick={addSection}>
Add Section
</Button>

</div>


{/* TABLE */}

<table className="w-full text-sm border border-white/20">

<thead>
<tr>
<th className="border p-2">Class</th>
<th className="border p-2">Sections</th>
</tr>
</thead>

<tbody>

{classes.map((c)=>{

const classSections = sections.filter(
(s)=>s.class_id===c.id
)

return(

<tr key={c.id}>

<td className="border p-2">
{c.name}
</td>

<td className="border p-2">

<div className="flex flex-wrap gap-2">

{classSections.map((s)=>(
<span
key={s.id}
className="bg-white/10 border border-white/20 px-3 py-1 rounded"
>
{s.name}
</span>
))}

</div>

</td>

</tr>

)

})}

</tbody>

</table>

</Card>

</div>

)

}