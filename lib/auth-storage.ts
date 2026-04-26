function getCurrentHostname() {
  if (typeof window === "undefined") return null
  return window.location.hostname.toLowerCase()
}

function getSafeSessionStorage() {
  if (typeof window === "undefined") return null

  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function canShareSessionAcrossSubdomains() {
  return false
}

export function getAuthStorageKey() {
  const hostname = getCurrentHostname()

  if (!hostname) return "naysha-auth-token"

  const subdomain = hostname.split(".")[0]
  const safeSubdomain = (subdomain || "root").replace(/[^a-z0-9_-]/gi, "_")

  return `naysha-auth-token-${safeSubdomain}`
}

export function resolveTenantOrigin(subdomain: string) {
  const { protocol, hostname, port } = window.location
  const originPort = port ? `:${port}` : ""

  if (
    hostname.includes("localhost") ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  ) {
    return `${protocol}//${hostname}${originPort}`
  }

  const hostParts = hostname.split(".")

  if (hostParts.length <= 2) {
    return `${protocol}//${subdomain}.${hostname}${originPort}`
  }

  const [, ...rest] = hostParts
  return `${protocol}//${subdomain}.${rest.join(".")}${originPort}`
}

export const authSessionStorage = {
  getItem(key: string) {
    return getSafeSessionStorage()?.getItem(key) || null
  },
  setItem(key: string, value: string) {
    getSafeSessionStorage()?.setItem(key, value)
  },
  removeItem(key: string) {
    getSafeSessionStorage()?.removeItem(key)
  },
}
