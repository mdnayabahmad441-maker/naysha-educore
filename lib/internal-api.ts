export function getInternalApiHeaders() {
  return {
    "Content-Type": "application/json",
    "x-internal-service-key": process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }
}

export function getBaseUrl(request: Request) {
  const url = new URL(request.url)
  return url.origin
}
