import React from "react"

type Props = React.InputHTMLAttributes<HTMLInputElement>

export default function Input(props: Props) {
  return (
    <input
      {...props}
      className="bg-slate-800 border border-white/20 p-2 rounded w-full"
    />
  )
}