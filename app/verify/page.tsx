import { Suspense } from "react"
import VerifyClient from "./verify-client"

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <VerifyClient />
    </Suspense>
  )
}