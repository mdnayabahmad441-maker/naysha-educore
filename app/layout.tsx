import "./globals.css"
import { SchoolProvider } from "@/context/SchoolContext"
import ThemeProvider from "@/components/providers/ThemeProvider"
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  metadataBase: new URL("https://www.naysha.online"),
  title: {
    default: "NaySha EduCore — Modern Multi-School ERP & Management Platform",
    template: "%s | NaySha EduCore",
  },
  description:
    "Cloud-native school management SaaS platform engineered by Groenics. Real-time attendance with GPS verification, automated fee collection, report cards, and direct parent WhatsApp alerts.",
  keywords: [
    "school erp software",
    "school management system",
    "student information system",
    "fee management software",
    "school whatsapp notifications",
    "report card generator",
    "gps teacher attendance",
    "NaySha EduCore",
    "Groenics",
  ],
  authors: [{ name: "Groenics" }],
  creator: "Groenics",
  publisher: "Groenics",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/logo.png",
  },
  openGraph: {
    title: "NaySha EduCore — Modern Multi-School ERP & Management Platform",
    description:
      "Cloud-native school management SaaS platform. Real-time attendance, automated fee collection, report cards, and parent WhatsApp notifications.",
    url: "https://www.naysha.online",
    siteName: "NaySha EduCore",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NaySha EduCore — Multi-School ERP Platform",
    description:
      "Cloud-native school management software for Indian schools. Fees, attendance, exams, and parent communication.",
  },
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
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
