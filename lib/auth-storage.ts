type CookieOptions = {
  domain?: string
  maxAge?: number
}

function getCurrentHostname() {
  if (typeof window === "undefined") return null
  return window.location.hostname.toLowerCase()
}

function parseCookies() {
  return document.cookie.split(";").reduce<Record<string, string>>((acc, entry) => {
    const [rawName, ...rawValue] = entry.trim().split("=")

    if (!rawName) {
      return acc
    }

    acc[decodeURIComponent(rawName)] = decodeURIComponent(rawValue.join("="))
    return acc
  }, {})
}

function resolveCookieDomain() {
  if (typeof window === "undefined") return undefined

  const { hostname } = window.location

  if (
    hostname === "naysha.online" ||
    hostname.endsWith(".naysha.online")
  ) {
    return ".naysha.online"
  }

  return undefined
}

function setCookie(name: string, value: string, options: CookieOptions = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`, "Path=/", "SameSite=Lax"]

  if (window.location.protocol === "https:") {
    parts.push("Secure")
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`)
  }

  if (typeof options.maxAge === "number") {
    parts.push(`Max-Age=${options.maxAge}`)
  }

  document.cookie = parts.join("; ")
}

function removeCookie(name: string, domain?: string) {
  setCookie(name, "", {
    domain,
    maxAge: 0,
  })
}

export function canShareSessionAcrossSubdomains() {
  return Boolean(resolveCookieDomain())
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

  const cookieDomain = resolveCookieDomain()

  if (cookieDomain) {
    return `${protocol}//${subdomain}${cookieDomain}${originPort}`
  }

  const hostParts = hostname.split(".")

  if (hostParts.length <= 2) {
    return `${protocol}//${subdomain}.${hostname}${originPort}`
  }

  const [, ...rest] = hostParts
  return `${protocol}//${subdomain}.${rest.join(".")}${originPort}`
}

export const authCookieStorage = {
  getItem(key: string) {
    if (typeof document === "undefined") return null

    const cookies = parseCookies()
    return cookies[key] || null
  },
  setItem(key: string, value: string) {
    if (typeof document === "undefined") return

    setCookie(key, value, {
      domain: resolveCookieDomain(),
      maxAge: 60 * 60 * 24 * 7,
    })
  },
  removeItem(key: string) {
    if (typeof document === "undefined") return

    const domain = resolveCookieDomain()
    removeCookie(key, domain)

    if (domain) {
      removeCookie(key)
    }
  },
}
