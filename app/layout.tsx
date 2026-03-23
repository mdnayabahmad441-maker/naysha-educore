import "./globals.css"
import { SchoolProvider } from "@/context/SchoolContext"

export const metadata = {
  title: "NaySha EduCore ERP",
  description: "Multi School ERP Platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">
      <body className="bg-[#020817] text-white">

        {/* 🌍 GLOBAL SCHOOL CONTEXT */}
        <SchoolProvider>

          {children}

        </SchoolProvider>

      </body>
    </html>
  )
}