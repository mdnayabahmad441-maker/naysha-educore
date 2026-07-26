"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentReportCard(){

const [cards,setCards] = useState<any[]>([])

useEffect(()=>{
loadCards()
},[])

async function loadCards(){

const { data:userData } = await supabase.auth.getUser()

const email = userData.user?.email

const { data:student } =
await supabase
.from("students")
.select("*")
.eq("parent_email",email)
.single()

const { data } =
await supabase
.from("reportcards")
.select("*")
.eq("student_id",student.id)

setCards(data || [])

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-6">
Report Cards
</h1>

{cards.map(card=>(
<a
key={card.id}
href={card.pdf_url}
target="_blank"
className="block bg-white/10 p-4 rounded mb-3"
>
Download {card.term} Report Card
</a>
))}

</div>

)

}