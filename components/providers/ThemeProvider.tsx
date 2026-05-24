"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useSchool } from "@/context/SchoolContext"
import {
  THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
  type Theme,
  type ThemeId,
} from "@/lib/themes"

interface ThemeContextValue {
  currentThemeId: ThemeId
  currentTheme: Theme
  setTheme: (id: ThemeId) => Promise<void>
  isLoading: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  currentThemeId: DEFAULT_THEME_ID,
  currentTheme: getThemeById(DEFAULT_THEME_ID),
  setTheme: async () => {},
  isLoading: true,
})

export const useTheme = () => useContext(ThemeContext)

// ── DOM helpers ────────────────────────────────────────────────────────────────

function applyThemeToDom(theme: Theme) {
  const root = document.documentElement
  const cv = theme.cssVars

  root.setAttribute("data-theme", theme.id)

  // Apply all theme-specific CSS vars
  Object.entries(cv).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  // ── Map to legacy variable names used by existing components ──────────────
  // --bg-main   → used in admin layout: bg-(--bg-main)
  // --bg-card   → used in admin layout: bg-(--bg-card)
  // --border    → used in .card, .table-container
  // --text-main → used in body
  // --primary   → used in .btn-primary, focus rings
  root.style.setProperty("--bg-main",   cv["--color-bg"])
  root.style.setProperty("--bg-card",   cv["--color-bg-2"])   // opaque card/sidebar bg
  root.style.setProperty("--bg-soft",   cv["--color-surface-2"])
  root.style.setProperty("--border",    cv["--color-border"])
  root.style.setProperty("--text-main", cv["--color-text"])
  root.style.setProperty("--text-muted",cv["--color-text-muted"])
  root.style.setProperty("--primary",   cv["--color-accent"])
  root.style.setProperty("--primary-2", cv["--color-accent-2"])
}

function injectFonts(theme: Theme) {
  const uniqueFamilies = [...new Set([theme.fonts.display, theme.fonts.body])]
  const weightlessFonts = ["Bebas Neue"]

  const familyParams = uniqueFamilies
    .map((f) => {
      const encoded = f.replace(/ /g, "+")
      return weightlessFonts.includes(f)
        ? `family=${encoded}`
        : `family=${encoded}:wght@400;500;600;700`
    })
    .join("&")

  const href = `https://fonts.googleapis.com/css2?${familyParams}&display=swap`

  const existing = document.querySelector<HTMLLinkElement>("link[data-theme-fonts]")
  if (existing) {
    if (existing.href !== href) existing.href = href
  } else {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = href
    link.setAttribute("data-theme-fonts", "true")
    document.head.appendChild(link)
  }
}

const STORAGE_KEY = "naysha-theme"

// ── Provider ───────────────────────────────────────────────────────────────────

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const school = useSchool()
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID)
  const [isLoading, setIsLoading] = useState(true)
  const fetchedForSchool = useRef<string | null>(null)

  useEffect(() => {
    // Apply cached theme immediately to minimise flash
    const cached = localStorage.getItem(STORAGE_KEY) as ThemeId | null
    if (cached && THEMES.some((t) => t.id === cached)) {
      const theme = getThemeById(cached)
      applyThemeToDom(theme)
      injectFonts(theme)
      setThemeId(cached)
    } else {
      const def = getThemeById(DEFAULT_THEME_ID)
      applyThemeToDom(def)
      injectFonts(def)
    }

    if (!school?.id) {
      setIsLoading(false)
      return
    }

    if (fetchedForSchool.current === school.id) return
    fetchedForSchool.current = school.id

    supabase
      .from("schools")
      .select("ui_theme")
      .eq("id", school.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error) {
          const raw = (data as Record<string, unknown> | null)?.ui_theme
          const id = (typeof raw === "string" && THEMES.some((t) => t.id === raw))
            ? (raw as ThemeId)
            : DEFAULT_THEME_ID

          const theme = getThemeById(id)
          applyThemeToDom(theme)
          injectFonts(theme)
          setThemeId(id)
          localStorage.setItem(STORAGE_KEY, id)
        }
        setIsLoading(false)
      })
  }, [school?.id])

  const setTheme = async (id: ThemeId): Promise<void> => {
    if (!school?.id) return

    const previousId = themeId
    const newTheme = getThemeById(id)

    // Optimistic update — apply immediately
    setThemeId(id)
    applyThemeToDom(newTheme)
    injectFonts(newTheme)
    localStorage.setItem(STORAGE_KEY, id)

    const { data, error } = await supabase
      .from("schools")
      .update({ ui_theme: id })
      .eq("id", school.id)
      .select("id")

    const failed = error || !data || data.length === 0

    if (failed) {
      const prevTheme = getThemeById(previousId)
      setThemeId(previousId)
      applyThemeToDom(prevTheme)
      injectFonts(prevTheme)
      localStorage.setItem(STORAGE_KEY, previousId)
      throw new Error(
        error?.code === "42703"
          ? "ui_theme column missing — run the SQL migration in Supabase."
          : error?.message ?? "No rows updated — check your Supabase UPDATE policy for the schools table."
      )
    }
  }

  return (
    <ThemeContext.Provider
      value={{ currentThemeId: themeId, currentTheme: getThemeById(themeId), setTheme, isLoading }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
