"use client"

import { supabase } from "@/lib/supabase"

export default function DocumentUploader({studentId}:any){

async function upload(e:any,type:string){

const file = e.target.files[0]

const fileName = Date.now()+"_"+file.name

await supabase.storage
.from("student-docs")
.upload(fileName,file)

const url =
`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/student-docs/${fileName}`

await supabase
.from("student_documents")
.insert({
student_id:studentId,
type,
file_url:url
})

alert("Uploaded")

}

return(

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="font-bold mb-4">Documents</h2>

<input type="file" onChange={(e)=>upload(e,"aadhar")}/>
<input type="file" onChange={(e)=>upload(e,"tc")}/>
<input type="file" onChange={(e)=>upload(e,"medical")}/>

</div>

)

}