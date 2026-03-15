"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"

export default function LoginPage() {

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const login = async () => {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if(!error){
      router.push("/admin/dashboard")
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <Card>

        <h1 className="text-2xl mb-6">Login</h1>

        <div className="flex flex-col gap-4 w-80">

          <Input
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          />

          <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          />

          <Button color="blue">
            Login
          </Button>

        </div>

      </Card>

    </div>

  )
}