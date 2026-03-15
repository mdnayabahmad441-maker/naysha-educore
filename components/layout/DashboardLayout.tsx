"use client"

import Sidebar from "./Sidebar"
import Topbar from "./Topbar"

export default function DashboardLayout({ children }: any) {
  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1">

        <Topbar />

        <div className="p-10 text-white max-w-7xl mx-auto">
          {children}
        </div>

      </div>

    </div>
  )
}