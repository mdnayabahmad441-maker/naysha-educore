"use client"

export default function Logout(){

function logout(){

document.cookie="role=; Max-Age=0; path=/"
document.cookie="uid=; Max-Age=0; path=/"
document.cookie="school=; Max-Age=0; path=/"

window.location.href="/auth/login"

}

return(

<button
onClick={logout}
className="px-4 py-2 bg-red-600 rounded"
>
Logout
</button>

)

}