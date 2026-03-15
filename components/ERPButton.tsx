type Props={
label:string
color:"blue"|"green"|"yellow"|"purple"|"red"
onClick?:()=>void
}

export default function ERPButton({label,color,onClick}:Props){

const colors={
blue:"bg-blue-600",
green:"bg-green-600",
yellow:"bg-yellow-500",
purple:"bg-purple-600",
red:"bg-red-600"
}

return(

<button
onClick={onClick}
className={`${colors[color]} px-4 py-2 rounded text-white`}
>

{label}

</button>

)

}