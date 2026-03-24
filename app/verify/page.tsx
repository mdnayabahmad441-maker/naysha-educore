import { Suspense } from "react"
import VerifyPageClient from "./VerifyPageClient"

export default function Page() {
  return (
    <Suspense fallback={<div style={{color:"white"}}>Loading...</div>}>
      <VerifyPageClient />
    </Suspense>
  )
}