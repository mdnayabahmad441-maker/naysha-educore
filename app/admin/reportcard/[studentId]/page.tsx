"use client"

import { useEffect,useState,useRef } from "react"
import { useReactToPrint } from "react-to-print"
import { supabase } from "@/lib/supabase"

export default function ReportCard(){

const reportRef = useRef<HTMLDivElement>(null)

const handlePrint = useReactToPrint({
contentRef: reportRef
})

return(

<div>

<button
onClick={handlePrint}
className="bg-green-600 px-4 py-2 rounded"
>
Download PDF
</button>

<div ref={reportRef} className="bg-white text-black p-10">

<h1 className="text-2xl font-bold text-center">
School Report Card
</h1>

{/* Student info */}

{/* Marks table */}

{/* Total / Grade / Rank */}

</div>

</div>

)

}