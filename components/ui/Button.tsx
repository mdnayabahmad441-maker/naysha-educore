import React from "react"

type Props = {
  children: React.ReactNode
  color?: "blue" | "green" | "yellow" | "purple" | "red"
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export default function Button({ children, color = "blue", ...props }: Props) {

  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-500",
    purple: "bg-purple-600",
    red: "bg-red-600"
  }

  return (
    <button
      {...props}
      className={`${colors[color]} px-4 py-2 rounded`}
    >
      {children}
    </button>
  )
}