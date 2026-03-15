"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Analytics(){

const [stats,setStats]=useState<any>({})

async function load(){

const {data}=await supabase.from("exam_results").select("*")

if(!data) return

const avg =
data.reduce((a,b)=>a+b.percentage,0)/data.length

const pass =
data.filter(r=>r.status==="PASS").length

const fail =
data.filter(r=>r.status==="FAIL").length

setStats({
avg,
pass,
fail
})

}

useEffect(()=>{load()},[])

return(

<div className="p-8 space-y-6">

<h1 className="text-xl font-bold">Exam Analytics</h1>

<div className="grid grid-cols-3 gap-6">

<div className="p-6 bg-white shadow rounded">
Class Average
<h2 className="text-2xl">{stats.avg?.toFixed(2)}%</h2>
</div>

<div className="p-6 bg-green-100 rounded">
Pass Students
<h2 className="text-2xl">{stats.pass}</h2>
</div>

<div className="p-6 bg-red-100 rounded">
Fail Students
<h2 className="text-2xl">{stats.fail}</h2>
</div>

</div>

</div>

)
}