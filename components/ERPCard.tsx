export default function ERPCard({title,children}:{title:string,children:any}){

return(

<div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6">

<h2 className="text-lg font-semibold mb-4">{title}</h2>

{children}

</div>

)

}