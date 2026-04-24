const SUBDOMAIN_PATTERN = /^[a-z0-9-]{1,63}$/
const NEXT_PATHS = new Set(["/admin", "/teacher", "/parent"])

type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function sanitizeSubdomain(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase()

  if (!normalized || !SUBDOMAIN_PATTERN.test(normalized)) {
    return null
  }

  if (["www", "erp", "naysha"].includes(normalized)) {
    return null
  }

  return normalized
}

export function sanitizeNextPath(value: string | null | undefined) {
  const normalized = String(value || "").trim()
  return NEXT_PATHS.has(normalized) ? (normalized as "/admin" | "/teacher" | "/parent") : "/admin"
}

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }

  return headers.get("x-real-ip") || "unknown"
}

export function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    }
  }

  current.count += 1

  return {
    allowed: true,
    remaining: Math.max(limit - current.count, 0),
    resetAt: current.resetAt,
  }
}
