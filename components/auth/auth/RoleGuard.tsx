"use client"

export default function RoleGuard({role,children,user}:any){

  if(!user) return null

  if(user.role !== role){

    return(
      <div className="p-10 text-red-400">
        Access Denied
      </div>
    )

  }

  return children

}