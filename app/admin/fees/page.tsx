"use client"

import { useEffect,useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { createFee, getFees } from "@/services/fees.service"

export default function FeesPage(){

  const [fees,setFees] = useState<any[]>([])
  const [name,setName] = useState("")
  const [amount,setAmount] = useState("")

  const load = async()=>{
    const data = await getFees()
    setFees(data)
  }

  useEffect(()=>{
    load()
  },[])

  const submit = async()=>{

    await createFee({
      id:crypto.randomUUID(),
      name,
      amount:Number(amount)
    })

    setName("")
    setAmount("")

    load()

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Fees</h1>

      <Card>

        <div className="flex gap-4 mb-6">

          <input
            className="bg-slate-800 border border-white/20 p-2 rounded"
            placeholder="Fee Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <input
            className="bg-slate-800 border border-white/20 p-2 rounded"
            placeholder="Amount"
            value={amount}
            onChange={(e)=>setAmount(e.target.value)}
          />

          <Button color="green" onClick={submit}>
            Save
          </Button>

        </div>

        <table className="w-full text-sm border border-white/20">

          <thead>
            <tr>
              <th className="border p-2">Fee</th>
              <th className="border p-2">Amount</th>
            </tr>
          </thead>

          <tbody>

            {fees.map(f=>(
              <tr key={f.id}>
                <td className="border p-2">{f.name}</td>
                <td className="border p-2">{f.amount}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </Card>

    </div>

  )

}