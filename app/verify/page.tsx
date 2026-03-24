import dynamic from "next/dynamic"

const VerifyClient = dynamic(() => import("./verify-client"), {
  ssr: false
})

export default function VerifyPage() {
  return <VerifyClient />
}