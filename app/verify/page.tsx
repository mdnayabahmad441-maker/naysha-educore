import { Suspense } from "react"
import VerifyClient from "./verify-client"

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <VerifyClient />
    </Suspense>
  )
}