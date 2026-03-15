import { headers } from "next/headers"

export async function getTenantSlug() {

  const headerList = await headers()

  const host = headerList.get("host") || ""

  if (host.includes("localhost")) {
    return "local"
  }

  const parts = host.split(".")

  return parts[0]
}