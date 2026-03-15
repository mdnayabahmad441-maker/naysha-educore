"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Page(){

const [data,setData]=useState<any[]>([])

useEffect(()=>{

supabase.from("exam_results").select("*")
.then(res=>setData(res.data||[]))

},[])

const avg=data.reduce((a,b)=>a+b.percentage,0)/(data.length||1)

return(

<div className="p-10 text-white space-y-6">

<h1 className="text-2xl">Analytics</h1>

<div className="bg-white/10 border border-white/20 rounded-xl p-6">

Class Average: {avg.toFixed(2)}%

</div>

</div>

)
}