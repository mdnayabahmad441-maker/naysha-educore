"use client"

import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react"
import type { DocumentField, DocumentLayout } from "@/lib/document-layouts"

type ReportRow = {
  name: string
  total: number
  passing: number
  obtained: number
  status: string
}

type Props = {
  layout: DocumentLayout
  backgroundUrl?: string | null
  values: Record<string, string>
  photoUrl?: string | null
  rows?: ReportRow[]
  editable?: boolean
  selectedFieldId?: string | null
  onSelectField?: (fieldId: string) => void
  onFieldChange?: (fieldId: string, patch: Partial<DocumentField>) => void
  className?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function toRgba(hex: string | undefined, opacity: number | undefined) {
  if (!hex || opacity === undefined) return undefined

  const normalized = hex.replace("#", "")
  const source = normalized.length === 3
    ? normalized.split("").map((chunk) => chunk + chunk).join("")
    : normalized

  if (source.length !== 6) return undefined

  const r = parseInt(source.slice(0, 2), 16)
  const g = parseInt(source.slice(2, 4), 16)
  const b = parseInt(source.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

export default function DocumentCanvas({
  layout,
  backgroundUrl,
  values,
  photoUrl,
  rows = [],
  editable = false,
  selectedFieldId,
  onSelectField,
  onFieldChange,
  className = ""
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{
    fieldId: string
    startX: number
    startY: number
    startField: DocumentField
    rect: DOMRect
  } | null>(null)

  useEffect(() => {
    if (!editable || !onFieldChange) return

    const handleMove = (event: MouseEvent) => {
      if (!dragState.current) return

      const { fieldId, startX, startY, startField, rect } = dragState.current
      const deltaX = ((event.clientX - startX) / rect.width) * 100
      const deltaY = ((event.clientY - startY) / rect.height) * 100

      onFieldChange(fieldId, {
        x: clamp(startField.x + deltaX, 0, 100 - startField.w),
        y: clamp(startField.y + deltaY, 0, 100 - startField.h)
      })
    }

    const handleUp = () => {
      dragState.current = null
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [editable, onFieldChange])

  const beginDrag = (field: DocumentField, event: ReactMouseEvent<HTMLDivElement>) => {
    if (!editable || !onFieldChange || !containerRef.current) return

    dragState.current = {
      fieldId: field.id,
      startX: event.clientX,
      startY: event.clientY,
      startField: field,
      rect: containerRef.current.getBoundingClientRect()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_22px_44px_rgba(15,23,42,0.22)] ${className}`}
      style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
    >
      {backgroundUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={backgroundUrl} alt="Document template" className="absolute inset-0 h-full w-full object-contain bg-white" />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_42%,#e2e8f0_100%)]" />
      )}

      <div className="absolute inset-0">
        {layout.fields.map((field) => {
          const background = toRgba(field.bgColor, field.bgOpacity)
          const isSelected = editable && selectedFieldId === field.id

          return (
            <div
              key={field.id}
              onMouseDown={(event) => beginDrag(field, event)}
              onClick={() => onSelectField?.(field.id)}
              className={`absolute ${editable ? "cursor-move" : "cursor-default"} ${isSelected ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950/20" : ""}`}
              style={{
                left: `${field.x}%`,
                top: `${field.y}%`,
                width: `${field.w}%`,
                height: `${field.h}%`,
                borderRadius: field.borderRadius ? `${field.borderRadius}px` : undefined,
                border: editable || field.type !== "text" ? `1px dashed ${field.borderColor || "rgba(148,163,184,0.55)"}` : undefined,
                background
              }}
            >
              <FieldRenderer field={field} value={values[field.id] || ""} photoUrl={photoUrl} rows={rows} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FieldRenderer({
  field,
  value,
  photoUrl,
  rows
}: {
  field: DocumentField
  value: string
  photoUrl?: string | null
  rows: ReportRow[]
}) {
  if (field.type === "photo") {
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-white/70" style={{ borderRadius: "inherit" }}>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Student" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Photo
          </div>
        )}
      </div>
    )
  }

  if (field.type === "table") {
    return (
      <div className="h-full w-full overflow-hidden bg-white/88 text-[0.56rem] text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.08)]" style={{ borderRadius: "inherit" }}>
        <div className="grid grid-cols-[2.2fr_repeat(4,1fr)] bg-slate-900 px-2 py-1 font-semibold uppercase tracking-[0.16em] text-white">
          <span>Subject</span>
          <span className="text-center">Total</span>
          <span className="text-center">Pass</span>
          <span className="text-center">Obt.</span>
          <span className="text-center">Result</span>
        </div>

        <div className="divide-y divide-slate-200">
          {rows.slice(0, 8).map((row, index) => (
            <div key={`${row.name}-${index}`} className="grid grid-cols-[2.2fr_repeat(4,1fr)] px-2 py-1.5">
              <span className="truncate">{row.name}</span>
              <span className="text-center">{row.total}</span>
              <span className="text-center">{row.passing}</span>
              <span className="text-center">{row.obtained}</span>
              <span className={`text-center font-semibold ${row.status === "FAIL" ? "text-red-600" : "text-emerald-700"}`}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex h-full w-full items-center"
      style={{
        justifyContent:
          field.align === "center" ? "center" : field.align === "right" ? "flex-end" : "flex-start",
        textAlign: field.align || "left",
        fontSize: field.fontSize ? `${field.fontSize}px` : "12px",
        fontWeight: field.fontWeight || 600,
        color: field.color || "#111827",
        letterSpacing: field.letterSpacing ? `${field.letterSpacing}px` : undefined,
        textTransform: field.uppercase ? "uppercase" : undefined,
        padding: "0 8px",
        lineHeight: 1.25
      }}
    >
      <span>{value || field.label}</span>
    </div>
  )
}
