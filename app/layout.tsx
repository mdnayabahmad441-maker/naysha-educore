import "./globals.css"
import { SchoolProvider } from "@/context/SchoolContext"
import ThemeProvider from "@/components/providers/ThemeProvider"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "NaySha EduCore ERP",
  description: "Multi School ERP Platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* DNS prefetch for Google Fonts — shared across all 7 themes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SchoolProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SchoolProvider>
      </body>
    </html>
  )
}
