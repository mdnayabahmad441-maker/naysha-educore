import React from "react"

export default function Card({ children }: any) {
  return (
    <div className="bg-white/10 border border-white/20 backdrop-blur rounded-xl p-6">
      {children}
    </div>
  )
}