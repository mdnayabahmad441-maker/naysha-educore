import { Suspense } from "react"
import CallbackClient from "./CallbackClient"

export default function Page() {
  return (
    <Suspense fallback={<div style={{color:"white"}}>Loading...</div>}>
      <CallbackClient />
    </Suspense>
  )
}