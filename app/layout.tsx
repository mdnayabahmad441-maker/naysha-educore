import "./globals.css"
import { SchoolProvider } from "@/context/SchoolContext"
import ThemeProvider from "@/components/providers/ThemeProvider"

export const metadata = {
  title: "NaySha EduCore ERP",
  description: "Multi School ERP Platform",
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
