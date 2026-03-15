import React from "react"

export default function Table({ children }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border border-white/20">
        {children}
      </table>
    </div>
  )
}