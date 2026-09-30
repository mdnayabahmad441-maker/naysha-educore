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
const rateLimitStore = new Map<string, RateLimitEntry>()

// Centralized Redis client (if configured)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
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

function consumeMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
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

export function getClientIp(headers: Headers) {
  const realIp = headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  const cfIp = headers.get("cf-connecting-ip")
  if (cfIp) return cfIp.trim()

  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean)
    return ips[ips.length - 1] || "unknown"
  }

  return "unknown"
}
