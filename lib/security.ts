import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const SUBDOMAIN_PATTERN = /^[a-z0-9-]{1,63}$/
const NEXT_PATHS = new Set(["/admin", "/teacher", "/parent"])

type RateLimitEntry = {
  count: number
  resetAt: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

// In-memory fallback store
// Fail-safe tradeoff note:
// In-memory rate limiting is isolated to the executing serverless instance/container.
// While Redis is down, an attacker hitting multiple concurrent serverless nodes could
// consume more than the per-node quota. However, falling back to instance-local limits
// guarantees high availability for legitimate users rather than hard-failing (fail-closed)
// all school ERP workflows during third-party Redis connectivity degradation.
const rateLimitStore = new Map<string, RateLimitEntry>()

// Centralized Redis client (if configured) with bounded request timeout (1500ms)
// and single retry to prevent hanging serverless execution under network turbulence.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
        retry: { retries: 1 },
        signal: () => AbortSignal.timeout(1500),
      })
    : null

const limiters = new Map<string, Ratelimit>()

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`
  let limiter = limiters.get(cacheKey)
  if (!limiter && redis) {
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000))
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      analytics: false,
      prefix: "naysha:ratelimit",
    })
    limiters.set(cacheKey, limiter)
  }
  return limiter!
}

function pruneExpiredMemoryRateLimits(now: number) {
  // Tier 1: periodic expired keys cleanup when size exceeds 2000
  if (rateLimitStore.size > 2000) {
    for (const [k, entry] of rateLimitStore.entries()) {
      if (entry.resetAt <= now) {
        rateLimitStore.delete(k)
      }
    }
  }

  // Tier 2: Hard ceiling eviction if store still exceeds 5000 items (FIFO eviction of oldest keys)
  if (rateLimitStore.size > 5000) {
    let toRemove = rateLimitStore.size - 5000
    for (const k of rateLimitStore.keys()) {
      if (toRemove <= 0) break
      rateLimitStore.delete(k)
      toRemove--
    }
  }
}

function consumeMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  pruneExpiredMemoryRateLimits(now)

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

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (redis) {
    try {
      const upstashLimiter = getUpstashLimiter(limit, windowMs)
      const res = await upstashLimiter.limit(key)
      return {
        allowed: res.success,
        remaining: res.remaining,
        resetAt: res.reset,
      }
    } catch (err) {
      console.warn("[security:ratelimit] Redis limiter failed; falling back to in-memory store:", err)
    }
  }

  return consumeMemoryRateLimit(key, limit, windowMs)
}

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

export function sanitizeNextPath(value: string | null | undefined): "/admin" | "/teacher" | "/parent" {
  const normalized = String(value || "").trim()
  if (NEXT_PATHS.has(normalized)) return normalized as "/admin" | "/teacher" | "/parent"
  return "/admin"
}

export function getClientIp(headersOrRequest: Headers | Request) {
  const headers = "headers" in headersOrRequest ? headersOrRequest.headers : headersOrRequest

  // Trusted reverse-proxy headers (Vercel edge, Cloudflare)
  const realIp = headers.get("x-real-ip")
  if (realIp) return cleanIp(realIp)

  const vercelIp = headers.get("x-vercel-forwarded-for")
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim()
    if (first) return cleanIp(first)
  }

  const cfIp = headers.get("cf-connecting-ip")
  if (cfIp) return cleanIp(cfIp)

  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean)
    // First IP in list represents original client before proxy hops
    if (ips.length > 0) return cleanIp(ips[0])
  }

  return "127.0.0.1"
}

function cleanIp(ip: string): string {
  const trimmed = ip.trim()
  // Strip IPv6-mapped IPv4 prefix if present (::ffff:)
  const normalized = trimmed.startsWith("::ffff:") ? trimmed.slice(7) : trimmed
  // Remove port if present (e.g. 192.168.1.1:12345)
  if (normalized.includes(":") && !normalized.includes("::") && normalized.split(":").length === 2) {
    return normalized.split(":")[0]
  }
  return normalized.slice(0, 45) // Max length for IPv6 string
}

export function sanitizeDatabaseError(
  error: unknown,
  fallbackMessage = "An error occurred while processing your request"
): string {
  if (!error) return fallbackMessage

  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error)

  // Log raw diagnostic error on server without leaking sensitive info to client
  console.error("[database:error]", message)

  const lower = message.toLowerCase()
  if (lower.includes("violates unique constraint") || lower.includes("duplicate key")) {
    return "A record with this information already exists."
  }
  if (lower.includes("violates foreign key constraint")) {
    return "Referenced record does not exist."
  }
  if (lower.includes("violates check constraint")) {
    return "Invalid data provided."
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "You do not have permission to perform this action."
  }
  if (lower.includes("not found") || lower.includes("no rows")) {
    return "Requested record was not found."
  }

  return fallbackMessage
}

export type PhoneValidationResult = {
  valid: boolean
  canonical: string
  error?: string
}

export function normalizeIndianPhone(phone: string | null | undefined): PhoneValidationResult {
  if (!phone) {
    return { valid: false, canonical: "", error: "Phone number is required" }
  }

  const raw = String(phone).trim()
  // Strip formatting characters: spaces, hyphens, parentheses, plus
  const digits = raw.replace(/[\s\-\(\)\+]/g, "")

  if (!digits || !/^\d+$/.test(digits)) {
    return { valid: false, canonical: "", error: "Phone number must contain only digits and standard formatting" }
  }

  // Canonical domestic Indian mobile extraction:
  // - 10 digits starting with 6, 7, 8, 9
  // - 11 digits starting with 0 followed by 6, 7, 8, 9
  // - 12 digits starting with 91 followed by 6, 7, 8, 9
  let canonical = ""

  if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
    canonical = digits
  } else if (digits.length === 11 && digits.startsWith("0") && /^[6-9]\d{9}$/.test(digits.slice(1))) {
    canonical = digits.slice(1)
  } else if (digits.length === 12 && digits.startsWith("91") && /^[6-9]\d{9}$/.test(digits.slice(2))) {
    canonical = digits.slice(2)
  } else if (digits.length >= 10 && digits.length <= 15) {
    // Non-standard or international format:
    // Disallow obviously dummy/repetitive numbers
    const isRepetitive = /^(\d)\1+$/.test(digits)
    if (isRepetitive) {
      return { valid: false, canonical: "", error: "Invalid repetitive phone number" }
    }
    // Leading 0 is only valid as an Indian domestic trunk prefix for 10-digit mobile (handled above)
    if (digits.startsWith("0")) {
      return { valid: false, canonical: "", error: "Invalid phone number format" }
    }
    // Reject 10-digit numbers starting with 0-5 for domestic Indian context
    if (digits.length === 10 && /^[0-5]/.test(digits)) {
      return { valid: false, canonical: "", error: "Invalid mobile number prefix" }
    }
    canonical = digits
  } else {
    return { valid: false, canonical: "", error: "Phone number must be between 10 and 15 digits" }
  }

  // Check for repetitive digits in 10-digit canonical (e.g. 9999999999, 0000000000)
  if (/^(\d)\1{9}$/.test(canonical)) {
    return { valid: false, canonical: "", error: "Invalid phone number" }
  }

  return { valid: true, canonical }
}

