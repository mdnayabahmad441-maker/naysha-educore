import "./globals.css"

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
      <body>
        {children}
      </body>
    </html>
  )
}