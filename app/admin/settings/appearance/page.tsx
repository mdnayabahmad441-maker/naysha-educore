"use client"

import { useState } from "react"
import { THEMES, type ThemeId } from "@/lib/themes"
import { useTheme } from "@/components/providers/ThemeProvider"

// ── Mini theme preview card ────────────────────────────────────────────────────

function ThemePreview({ bg, card, accent, text }: { bg: string; card: string; accent: string; text: string }) {
  return (
    <div
      style={{
        background: bg,
        height: "96px",
        borderRadius: "8px 8px 0 0",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: "absolute",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: accent,
          opacity: 0.12,
          filter: "blur(20px)",
          top: "10px",
          right: "10px",
        }}
      />

      {/* Mini card */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          right: "14px",
          height: "56px",
          background: card,
          borderRadius: "6px",
          border: `1px solid ${accent}22`,
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: accent,
              flexShrink: 0,
            }}
          />
          <div
            style={{
              height: "5px",
              width: "55%",
              background: text,
              opacity: 0.5,
              borderRadius: "3px",
            }}
          />
        </div>
        {/* Text lines */}
        <div
          style={{
            height: "4px",
            width: "80%",
            background: text,
            opacity: 0.2,
            borderRadius: "2px",
          }}
        />
        <div
          style={{
            height: "4px",
            width: "60%",
            background: text,
            opacity: 0.15,
            borderRadius: "2px",
          }}
        />
        {/* Accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, ${accent}, transparent)`,
            borderRadius: "0 0 6px 6px",
          }}
        />
      </div>
    </div>
  )
}

// ── Skeleton card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="skeleton"
      style={{ height: "200px", borderRadius: "16px" }}
    />
  )
}

// ── Toast ──────────────────────────────────────────────────────────────────────

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: `translate(-50%, ${visible ? "0" : "80px"})`,
        opacity: visible ? 1 : 0,
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease",
        background: "linear-gradient(135deg, #10b981, #059669)",
        color: "#fff",
        padding: "12px 24px",
        borderRadius: "999px",
        fontSize: "14px",
        fontWeight: 600,
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
        zIndex: 9999,
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AppearancePage() {
  const { currentThemeId, setTheme, isLoading } = useTheme()
  const [applying, setApplying] = useState<ThemeId | null>(null)
  const [toastMsg, setToastMsg] = useState("")
  const [toastVisible, setToastVisible] = useState(false)
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    if (toastTimer) clearTimeout(toastTimer)
    const t = setTimeout(() => setToastVisible(false), 3000)
    setToastTimer(t)
  }

  const handleSelect = async (id: ThemeId) => {
    if (id === currentThemeId || applying) return
    setApplying(id)
    try {
      await setTheme(id)
      const theme = THEMES.find((t) => t.id === id)
      showToast(`✓ Theme updated — all users will now see ${theme?.label}`)
    } catch {
      showToast("✗ Failed to save theme. Please try again.")
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16 text-white">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display, inherit)", color: "var(--color-text, #fff)" }}
        >
          Appearance &amp; Theme
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted, #6b7280)" }}
        >
          Customize how NaySha EduCore looks for your entire school. All staff and
          admins will see this theme.
        </p>
      </div>

      {/* Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
          : THEMES.map((theme) => {
              const isActive = theme.id === currentThemeId
              const isApplying = applying === theme.id

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme.id)}
                  disabled={isApplying || applying !== null}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "left",
                    cursor: applying ? "wait" : "pointer",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: isActive
                      ? `2px solid ${theme.preview.accent}`
                      : "2px solid rgba(255,255,255,0.08)",
                    boxShadow: isActive
                      ? `0 0 0 3px ${theme.preview.accent}28, 0 20px 40px rgba(0,0,0,0.3)`
                      : "0 4px 20px rgba(0,0,0,0.2)",
                    transform: "translateY(0)",
                    transition:
                      "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                    background: "rgba(255,255,255,0.04)",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      ;(e.currentTarget as HTMLButtonElement).style.transform =
                        "translateY(-4px)"
                      ;(e.currentTarget as HTMLButtonElement).style.boxShadow =
                        "0 12px 40px rgba(0,0,0,0.35)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"
                    ;(e.currentTarget as HTMLButtonElement).style.boxShadow = isActive
                      ? `0 0 0 3px ${theme.preview.accent}28, 0 20px 40px rgba(0,0,0,0.3)`
                      : "0 4px 20px rgba(0,0,0,0.2)"
                  }}
                >
                  {/* Active badge */}
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        zIndex: 10,
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: theme.preview.accent,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 0 12px ${theme.preview.accent}80`,
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path
                          d="M2 6.5L5.5 10L11 3.5"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Applying spinner */}
                  {isApplying && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        zIndex: 10,
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        border: `2px solid ${theme.preview.accent}40`,
                        borderTopColor: theme.preview.accent,
                        animation: "spin-slow 0.7s linear infinite",
                      }}
                    />
                  )}

                  {/* Preview */}
                  <ThemePreview
                    bg={theme.preview.bg}
                    card={theme.preview.card}
                    accent={theme.preview.accent}
                    text={theme.preview.text}
                  />

                  {/* Info */}
                  <div style={{ padding: "14px 16px" }}>
                    <p
                      style={{
                        fontFamily: theme.fonts.display + ", sans-serif",
                        fontSize: "15px",
                        fontWeight: 700,
                        color: isActive ? theme.preview.accent : "#fff",
                        marginBottom: "4px",
                        lineHeight: 1.3,
                      }}
                    >
                      {theme.label}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        lineHeight: 1.5,
                      }}
                    >
                      {theme.description}
                    </p>
                  </div>
                </button>
              )
            })}
      </div>

      <Toast message={toastMsg} visible={toastVisible} />
    </div>
  )
}
