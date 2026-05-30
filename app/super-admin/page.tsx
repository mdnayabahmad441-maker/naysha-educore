"use client"

import { useEffect,useState } from "react"
import { getSchools } from "@/services/superadmin.service"
import { useAuth } from "@/hooks/useAuth"

export default function SuperAdmin(){

  const {user} = useAuth()

  const [schools,setSchools] = useState<any[]>([])

  useEffect(()=>{

    const load = async()=>{

      const data = await getSchools()
      setSchools(data)

    }

    load()

  },[])

  if(user?.role !== "super_admin"){

    return(
      <div className="p-10 text-red-400">
        Access Denied
      </div>
    )

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-3xl mb-8">
        NaySha ERP Control Panel
      </h1>

      <div className="overflow-x-auto">

        <table className="w-full text-sm border border-white/20">

          <thead>
            <tr>
              <th className="border p-2">School</th>
              <th className="border p-2">Subdomain</th>
              <th className="border p-2">Created</th>
            </tr>
          </thead>

          <tbody>

            {schools.map(s=>(
              <tr key={s.id}>

                <td className="border p-2">
                  {s.name}
                </td>

                <td className="border p-2">
                  {(s.subdomain || s.slug) ? `${s.subdomain || s.slug}.erp.naysha.online` : "Not set"}
                </td>

                <td className="border p-2">
                  {new Date(s.created_at).toLocaleDateString()}
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}
