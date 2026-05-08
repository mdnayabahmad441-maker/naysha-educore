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
    label: "Dark Glassmorphism",
    description: "Premium dark UI with frosted glass cards and indigo/purple glows",
    fonts: { display: "Syne", body: "DM Sans" },
    preview: { bg: "#0d0d1a", accent: "#6366f1", card: "#ffffff0a", text: "#ffffff" },
    cssVars: {
      "--color-bg": "#0d0d1a",
      "--color-bg-2": "#111827",
      "--color-surface": "rgba(255,255,255,0.04)",
      "--color-surface-2": "rgba(255,255,255,0.08)",
      "--color-border": "rgba(255,255,255,0.07)",
      "--color-accent": "#6366f1",
      "--color-accent-2": "#a855f7",
      "--color-accent-glow": "rgba(99,102,241,0.2)",
      "--color-text": "#ffffff",
      "--color-text-muted": "#6b7280",
      "--color-success": "#10b981",
      "--color-warning": "#f59e0b",
      "--color-danger": "#ef4444",
      "--font-display": "'Syne', sans-serif",
      "--font-body": "'DM Sans', sans-serif",
      "--radius-card": "16px",
      "--shadow-card": "0 0 40px rgba(99,102,241,0.1), 0 20px 40px rgba(0,0,0,0.4)",
    },
  },
  {
    id: "neon-brutalist",
    label: "Neon Brutalist",
    description: "Raw black canvas with electric green terminal aesthetics",
    fonts: { display: "Space Mono", body: "Space Mono" },
    preview: { bg: "#0a0a0a", accent: "#00ff88", card: "#00ff8810", text: "#ffffff" },
    cssVars: {
      "--color-bg": "#0a0a0a",
      "--color-bg-2": "#0f0f0f",
      "--color-surface": "rgba(0,255,136,0.04)",
      "--color-surface-2": "rgba(0,255,136,0.08)",
      "--color-border": "rgba(0,255,136,0.2)",
      "--color-accent": "#00ff88",
      "--color-accent-2": "#00cc6a",
      "--color-accent-glow": "rgba(0,255,136,0.15)",
      "--color-text": "#ffffff",
      "--color-text-muted": "#444444",
      "--color-success": "#00ff88",
      "--color-warning": "#ffcc00",
      "--color-danger": "#ff3333",
      "--font-display": "'Space Mono', monospace",
      "--font-body": "'Space Mono', monospace",
      "--radius-card": "0px",
      "--shadow-card": "0 0 30px rgba(0,255,136,0.1), 4px 4px 0 #00ff88",
    },
  },
  {
    id: "luxury-editorial",
    label: "Luxury Editorial",
    description: "Gold accents on dark headers with cream body — refined private school feel",
    fonts: { display: "Playfair Display", body: "DM Sans" },
    preview: { bg: "#faf8f5", accent: "#c9a84c", card: "#ffffff", text: "#1a1206" },
    cssVars: {
      "--color-bg": "#faf8f5",
      "--color-bg-2": "#f0ece4",
      "--color-surface": "#ffffff",
      "--color-surface-2": "#f5f1ea",
      "--color-border": "#e8e0d4",
      "--color-accent": "#c9a84c",
      "--color-accent-2": "#1a1206",
      "--color-accent-glow": "rgba(201,168,76,0.15)",
      "--color-text": "#1a1206",
      "--color-text-muted": "#999999",
      "--color-success": "#2d7a4f",
      "--color-warning": "#c9a84c",
      "--color-danger": "#c0392b",
      "--font-display": "'Playfair Display', serif",
      "--font-body": "'DM Sans', sans-serif",
      "--radius-card": "8px",
      "--shadow-card": "0 20px 60px rgba(0,0,0,0.08)",
    },
  },
  {
    id: "soft-neomorphic",
    label: "Soft Neomorphic",
    description: "Light grey canvas with embossed cards and purple gradient accents",
    fonts: { display: "Outfit", body: "Outfit" },
    preview: { bg: "#eef0f7", accent: "#6c63ff", card: "#eef0f7", text: "#1a1a2e" },
    cssVars: {
      "--color-bg": "#eef0f7",
      "--color-bg-2": "#e8eaf2",
      "--color-surface": "#eef0f7",
      "--color-surface-2": "#e4e6f0",
      "--color-border": "rgba(255,255,255,0.8)",
      "--color-accent": "#6c63ff",
      "--color-accent-2": "#3b82f6",
      "--color-accent-glow": "rgba(108,99,255,0.2)",
      "--color-text": "#1a1a2e",
      "--color-text-muted": "#9999aa",
      "--color-success": "#10b981",
      "--color-warning": "#f59e0b",
      "--color-danger": "#ef4444",
      "--font-display": "'Outfit', sans-serif",
      "--font-body": "'Outfit', sans-serif",
      "--radius-card": "16px",
      "--shadow-card": "8px 8px 24px #d1d4e0, -8px -8px 24px #ffffff",
    },
  },
  {
    id: "cosmic",
    label: "Cosmic — Orange · White · Blue",
    description: "Deep space black with fiery orange and electric blue nebula glows",
    fonts: { display: "Bebas Neue", body: "Rajdhani" },
    preview: { bg: "#04080f", accent: "#ff6414", card: "#ffffff08", text: "#ffffff" },
    cssVars: {
      "--color-bg": "#04080f",
      "--color-bg-2": "#060c18",
      "--color-surface": "rgba(255,255,255,0.03)",
      "--color-surface-2": "rgba(255,255,255,0.06)",
      "--color-border": "rgba(255,255,255,0.06)",
      "--color-accent": "#ff6414",
      "--color-accent-2": "#1e50ff",
      "--color-accent-glow": "rgba(255,100,20,0.15)",
      "--color-text": "#ffffff",
      "--color-text-muted": "rgba(255,255,255,0.3)",
      "--color-success": "#00ff88",
      "--color-warning": "#ff9832",
      "--color-danger": "#ff3333",
      "--font-display": "'Bebas Neue', cursive",
      "--font-body": "'Rajdhani', sans-serif",
      "--radius-card": "12px",
      "--shadow-card":
        "0 0 60px rgba(255,100,20,0.1), 0 0 100px rgba(30,80,255,0.08), 0 30px 60px rgba(0,0,0,0.6)",
    },
  },
  {
    id: "emerald",
    label: "Bioluminescent Emerald",
    description: "Deep black with living glowing green — like a living data organism",
    fonts: { display: "Space Grotesk", body: "Space Grotesk" },
    preview: { bg: "#030d08", accent: "#00dc5a", card: "#00ff6408", text: "#ffffff" },
    cssVars: {
      "--color-bg": "#030d08",
      "--color-bg-2": "#051208",
      "--color-surface": "rgba(0,255,100,0.03)",
      "--color-surface-2": "rgba(0,255,100,0.06)",
      "--color-border": "rgba(0,255,100,0.1)",
      "--color-accent": "#00dc5a",
      "--color-accent-2": "#00ff9d",
      "--color-accent-glow": "rgba(0,220,90,0.15)",
      "--color-text": "#ffffff",
      "--color-text-muted": "rgba(255,255,255,0.25)",
      "--color-success": "#00dc5a",
      "--color-warning": "#ffcc00",
      "--color-danger": "#ff4444",
      "--font-display": "'Space Grotesk', sans-serif",
      "--font-body": "'Space Grotesk', sans-serif",
      "--radius-card": "12px",
      "--shadow-card": "0 0 60px rgba(0,200,80,0.08), 0 30px 60px rgba(0,0,0,0.7)",
    },
  },
  {
    id: "crimson-noir",
    label: "Crimson Noir",
    description: "Cinematic dark red with serif typography — dramatic and authoritative",
    fonts: { display: "Cormorant Garamond", body: "Space Grotesk" },
    preview: { bg: "#08040a", accent: "#c81e3c", card: "#ffffff06", text: "#ffffff" },
    cssVars: {
      "--color-bg": "#08040a",
      "--color-bg-2": "#1a040a",
      "--color-surface": "rgba(200,30,60,0.04)",
      "--color-surface-2": "rgba(200,30,60,0.08)",
      "--color-border": "rgba(200,30,60,0.12)",
      "--color-accent": "#c81e3c",
      "--color-accent-2": "#e8364e",
      "--color-accent-glow": "rgba(200,30,60,0.15)",
      "--color-text": "#ffffff",
      "--color-text-muted": "rgba(255,255,255,0.25)",
      "--color-success": "#10b981",
      "--color-warning": "#f59e0b",
      "--color-danger": "#c81e3c",
      "--font-display": "'Cormorant Garamond', serif",
      "--font-body": "'Space Grotesk', sans-serif",
      "--radius-card": "10px",
      "--shadow-card": "0 0 60px rgba(180,20,50,0.1), 0 30px 60px rgba(0,0,0,0.8)",
    },
  },
]

export const DEFAULT_THEME_ID: ThemeId = "dark-glass"

export function getThemeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}
