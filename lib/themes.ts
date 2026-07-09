export type ThemeId =
  | "dark-glass"
  | "neon-brutalist"
  | "luxury-editorial"
  | "soft-neomorphic"
  | "cosmic"
  | "emerald"
  | "crimson-noir"

export interface Theme {
  id: ThemeId
  label: string
  description: string
  fonts: { display: string; body: string }
  preview: { bg: string; accent: string; card: string; text: string }
  cssVars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    id: "dark-glass",
    label: "Trust Blue Glass",
    description: "Calm premium dark UI with blue trust, cyan energy, and soft violet depth.",
    fonts: { display: "Syne", body: "DM Sans" },
    preview: { bg: "#07111f", accent: "#3b82f6", card: "#ffffff12", text: "#f8fafc" },
    cssVars: {
      "--color-bg": "#07111f",
      "--color-bg-2": "#0d1b2f",
      "--color-surface": "rgba(255,255,255,0.07)",
      "--color-surface-2": "rgba(59,130,246,0.12)",
      "--color-border": "rgba(148,163,184,0.18)",
      "--color-accent": "#3b82f6",
      "--color-accent-2": "#06b6d4",
      "--color-accent-glow": "rgba(59,130,246,0.28)",
      "--color-text": "#f8fafc",
      "--color-text-muted": "#a7b4c8",
      "--color-success": "#22c55e",
      "--color-warning": "#f59e0b",
      "--color-danger": "#f43f5e",
      "--font-display": "'Syne', sans-serif",
      "--font-body": "'DM Sans', sans-serif",
      "--radius-card": "16px",
      "--shadow-card": "0 22px 60px rgba(2,8,23,0.42), 0 0 34px rgba(59,130,246,0.16)",
    },
  },
  {
    id: "neon-brutalist",
    label: "Momentum Neon",
    description: "High-energy dark UI with green progress and cyan action cues.",
    fonts: { display: "Space Mono", body: "Space Mono" },
    preview: { bg: "#050907", accent: "#00e676", card: "#00e67612", text: "#f7fff9" },
    cssVars: {
      "--color-bg": "#050907",
      "--color-bg-2": "#0b1510",
      "--color-surface": "rgba(0,230,118,0.07)",
      "--color-surface-2": "rgba(6,182,212,0.11)",
      "--color-border": "rgba(45,212,191,0.24)",
      "--color-accent": "#00e676",
      "--color-accent-2": "#06b6d4",
      "--color-accent-glow": "rgba(0,230,118,0.24)",
      "--color-text": "#f7fff9",
      "--color-text-muted": "#98b7a6",
      "--color-success": "#00e676",
      "--color-warning": "#facc15",
      "--color-danger": "#fb7185",
      "--font-display": "'Space Mono', monospace",
      "--font-body": "'Space Mono', monospace",
      "--radius-card": "0px",
      "--shadow-card": "0 0 30px rgba(0,230,118,0.16), 4px 4px 0 rgba(0,230,118,0.72)",
    },
  },
  {
    id: "luxury-editorial",
    label: "Premium Academy",
    description: "Bright private-school palette with navy trust, gold reward, and crisp readable text.",
    fonts: { display: "Playfair Display", body: "DM Sans" },
    preview: { bg: "#fbf7ef", accent: "#b88716", card: "#ffffff", text: "#1e293b" },
    cssVars: {
      "--color-bg": "#fbf7ef",
      "--color-bg-2": "#ffffff",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#fff4d6",
      "--color-border": "#e8dcc4",
      "--color-accent": "#b88716",
      "--color-accent-2": "#1d4ed8",
      "--color-accent-glow": "rgba(184,135,22,0.2)",
      "--color-text": "#1e293b",
      "--color-text-muted": "#64748b",
      "--color-success": "#15803d",
      "--color-warning": "#d97706",
      "--color-danger": "#dc2626",
      "--font-display": "'Playfair Display', serif",
      "--font-body": "'DM Sans', sans-serif",
      "--radius-card": "8px",
      "--shadow-card": "0 18px 44px rgba(15,23,42,0.1)",
    },
  },
  {
    id: "soft-neomorphic",
    label: "Clean Product Light",
    description: "Modern app-store style light UI with blue action, violet delight, and generous contrast.",
    fonts: { display: "Outfit", body: "Outfit" },
    preview: { bg: "#f6f8ff", accent: "#2563eb", card: "#ffffff", text: "#0f172a" },
    cssVars: {
      "--color-bg": "#f6f8ff",
      "--color-bg-2": "#ffffff",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#eef4ff",
      "--color-border": "#dbe3f0",
      "--color-accent": "#2563eb",
      "--color-accent-2": "#7c3aed",
      "--color-accent-glow": "rgba(37,99,235,0.18)",
      "--color-text": "#0f172a",
      "--color-text-muted": "#64748b",
      "--color-success": "#16a34a",
      "--color-warning": "#ea580c",
      "--color-danger": "#dc2626",
      "--font-display": "'Outfit', sans-serif",
      "--font-body": "'Outfit', sans-serif",
      "--radius-card": "16px",
      "--shadow-card": "0 18px 45px rgba(37,99,235,0.11), 0 2px 8px rgba(15,23,42,0.06)",
    },
  },
  {
    id: "cosmic",
    label: "Focus Cosmic",
    description: "Deep focused UI with orange attention points and electric-blue confidence.",
    fonts: { display: "Bebas Neue", body: "Rajdhani" },
    preview: { bg: "#050b18", accent: "#fb923c", card: "#ffffff0d", text: "#ffffff" },
    cssVars: {
      "--color-bg": "#050b18",
      "--color-bg-2": "#0c1730",
      "--color-surface": "rgba(255,255,255,0.06)",
      "--color-surface-2": "rgba(59,130,246,0.12)",
      "--color-border": "rgba(147,197,253,0.16)",
      "--color-accent": "#fb923c",
      "--color-accent-2": "#2563eb",
      "--color-accent-glow": "rgba(251,146,60,0.22)",
      "--color-text": "#ffffff",
      "--color-text-muted": "rgba(226,232,240,0.72)",
      "--color-success": "#22c55e",
      "--color-warning": "#fb923c",
      "--color-danger": "#f43f5e",
      "--font-display": "'Bebas Neue', cursive",
      "--font-body": "'Rajdhani', sans-serif",
      "--radius-card": "12px",
      "--shadow-card":
        "0 0 56px rgba(251,146,60,0.13), 0 0 86px rgba(37,99,235,0.1), 0 28px 60px rgba(0,0,0,0.48)",
    },
  },
  {
    id: "emerald",
    label: "Growth Emerald",
    description: "Achievement-focused green with teal depth and bright progress feedback.",
    fonts: { display: "Space Grotesk", body: "Space Grotesk" },
    preview: { bg: "#03120d", accent: "#10b981", card: "#10b98110", text: "#f8fffb" },
    cssVars: {
      "--color-bg": "#03120d",
      "--color-bg-2": "#082016",
      "--color-surface": "rgba(16,185,129,0.07)",
      "--color-surface-2": "rgba(20,184,166,0.1)",
      "--color-border": "rgba(45,212,191,0.18)",
      "--color-accent": "#10b981",
      "--color-accent-2": "#14b8a6",
      "--color-accent-glow": "rgba(16,185,129,0.24)",
      "--color-text": "#f8fffb",
      "--color-text-muted": "rgba(209,250,229,0.68)",
      "--color-success": "#22c55e",
      "--color-warning": "#f59e0b",
      "--color-danger": "#fb7185",
      "--font-display": "'Space Grotesk', sans-serif",
      "--font-body": "'Space Grotesk', sans-serif",
      "--radius-card": "12px",
      "--shadow-card": "0 0 54px rgba(16,185,129,0.14), 0 28px 60px rgba(0,0,0,0.58)",
    },
  },
  {
    id: "crimson-noir",
    label: "Executive Crimson",
    description: "Authoritative dark UI with red urgency, rose warmth, and gold attention cues.",
    fonts: { display: "Cormorant Garamond", body: "Space Grotesk" },
    preview: { bg: "#10050a", accent: "#e11d48", card: "#ffffff0a", text: "#fff7f9" },
    cssVars: {
      "--color-bg": "#10050a",
      "--color-bg-2": "#1d0710",
      "--color-surface": "rgba(244,63,94,0.07)",
      "--color-surface-2": "rgba(251,191,36,0.1)",
      "--color-border": "rgba(251,113,133,0.18)",
      "--color-accent": "#e11d48",
      "--color-accent-2": "#f59e0b",
      "--color-accent-glow": "rgba(225,29,72,0.22)",
      "--color-text": "#fff7f9",
      "--color-text-muted": "rgba(255,228,230,0.68)",
      "--color-success": "#22c55e",
      "--color-warning": "#f59e0b",
      "--color-danger": "#fb7185",
      "--font-display": "'Cormorant Garamond', serif",
      "--font-body": "'Space Grotesk', sans-serif",
      "--radius-card": "10px",
      "--shadow-card": "0 0 56px rgba(225,29,72,0.15), 0 28px 60px rgba(0,0,0,0.68)",
    },
  },
]

export const DEFAULT_THEME_ID: ThemeId = "dark-glass"

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
