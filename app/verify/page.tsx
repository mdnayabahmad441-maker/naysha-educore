import { Suspense } from "react"
import VerifyClient from "./verify-client"

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="text-white text-center mt-20">Loading...</div>}>
      <VerifyClient />
    </Suspense>
  )
}