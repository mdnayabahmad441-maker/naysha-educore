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
  logoUrl?: string | null
  rows?: ReportRow[]
  editable?: boolean
  selectedFieldId?: string | null
  onSelectField?: (fieldId: string) => void
  onFieldChange?: (fieldId: string, patch: Partial<DocumentField>) => void
  interactionMode?: "drag" | "place"
  showGrid?: boolean
  snapToGrid?: boolean
  zoom?: number
  className?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function snap(value: number, enabled: boolean, step = 0.5) {
  if (!enabled) return value
  return Math.round(value / step) * step
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
  logoUrl,
  rows = [],
  editable = false,
  selectedFieldId,
  onSelectField,
  onFieldChange,
  interactionMode = "drag",
  showGrid = false,
  snapToGrid = false,
  zoom = 1,
  className = ""
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{
    type: "move" | "resize"
    fieldId: string
    startX: number
    startY: number
    startField: DocumentField
    rect: DOMRect
    handle?: "nw" | "ne" | "sw" | "se"
  } | null>(null)

  useEffect(() => {
    if (!editable || !onFieldChange) return

    const handleMove = (event: MouseEvent) => {
      if (!dragState.current) return

      const { type, fieldId, startX, startY, startField, rect, handle } = dragState.current
      const deltaX = ((event.clientX - startX) / rect.width) * 100
      const deltaY = ((event.clientY - startY) / rect.height) * 100

      if (type === "move") {
        onFieldChange(fieldId, {
          x: snap(clamp(startField.x + deltaX, 0, 100 - startField.w), snapToGrid),
          y: snap(clamp(startField.y + deltaY, 0, 100 - startField.h), snapToGrid)
        })
        return
      }

      const minWidth = startField.type === "photo" ? 10 : 8
      const minHeight = startField.type === "photo" ? 10 : 3
      let nextX = startField.x
      let nextY = startField.y
      let nextW = startField.w
      let nextH = startField.h

      if (handle === "se") {
        nextW = clamp(startField.w + deltaX, minWidth, 100 - startField.x)
        nextH = clamp(startField.h + deltaY, minHeight, 100 - startField.y)
      }

      if (handle === "sw") {
        nextX = clamp(startField.x + deltaX, 0, startField.x + startField.w - minWidth)
        nextW = clamp(startField.w - deltaX, minWidth, startField.x + startField.w)
        nextH = clamp(startField.h + deltaY, minHeight, 100 - startField.y)
      }

      if (handle === "ne") {
        nextW = clamp(startField.w + deltaX, minWidth, 100 - startField.x)
        nextY = clamp(startField.y + deltaY, 0, startField.y + startField.h - minHeight)
        nextH = clamp(startField.h - deltaY, minHeight, startField.y + startField.h)
      }

      if (handle === "nw") {
        nextX = clamp(startField.x + deltaX, 0, startField.x + startField.w - minWidth)
        nextY = clamp(startField.y + deltaY, 0, startField.y + startField.h - minHeight)
        nextW = clamp(startField.w - deltaX, minWidth, startField.x + startField.w)
        nextH = clamp(startField.h - deltaY, minHeight, startField.y + startField.h)
      }

      onFieldChange(fieldId, {
        x: snap(nextX, snapToGrid),
        y: snap(nextY, snapToGrid),
        w: snap(nextW, snapToGrid),
        h: snap(nextH, snapToGrid)
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
    if (interactionMode !== "drag") return

    dragState.current = {
      type: "move",
      fieldId: field.id,
      startX: event.clientX,
      startY: event.clientY,
      startField: field,
      rect: containerRef.current.getBoundingClientRect()
    }
  }

  const beginResize = (
    field: DocumentField,
    handle: "nw" | "ne" | "sw" | "se",
    event: ReactMouseEvent<HTMLButtonElement>
  ) => {
    if (!editable || !onFieldChange || !containerRef.current) return

    event.stopPropagation()

    dragState.current = {
      type: "resize",
      fieldId: field.id,
      startX: event.clientX,
      startY: event.clientY,
      startField: field,
      rect: containerRef.current.getBoundingClientRect(),
      handle
    }
  }

  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!editable || !onFieldChange || !containerRef.current || !selectedFieldId) return
    if (interactionMode !== "place") return

    const field = layout.fields.find((item) => item.id === selectedFieldId)
    if (!field) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    onFieldChange(field.id, {
      x: snap(clamp(x, 0, 100 - field.w), snapToGrid),
      y: snap(clamp(y, 0, 100 - field.h), snapToGrid)
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!editable || !onFieldChange || !selectedFieldId) return

    const field = layout.fields.find((item) => item.id === selectedFieldId)
    if (!field) return

    const step = event.shiftKey ? 1 : 0.25

    if (event.key === "ArrowLeft") {
      event.preventDefault()
      onFieldChange(field.id, { x: snap(clamp(field.x - step, 0, 100 - field.w), snapToGrid) })
    }

    if (event.key === "ArrowRight") {
      event.preventDefault()
      onFieldChange(field.id, { x: snap(clamp(field.x + step, 0, 100 - field.w), snapToGrid) })
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      onFieldChange(field.id, { y: snap(clamp(field.y - step, 0, 100 - field.h), snapToGrid) })
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()
      onFieldChange(field.id, { y: snap(clamp(field.y + step, 0, 100 - field.h), snapToGrid) })
    }
  }

  return (
    <div className={`overflow-auto rounded-[28px] ${className}`}>
      <div
        ref={containerRef}
        tabIndex={editable ? 0 : -1}
        onClick={handleCanvasClick}
        onKeyDown={handleKeyDown}
        className="relative mx-auto overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-[0_22px_44px_rgba(15,23,42,0.22)]"
        style={{ aspectRatio: `${layout.width} / ${layout.height}`, width: `${Math.max(zoom * 100, 100)}%` }}
      >
        {backgroundUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundUrl} alt="Document template" className="absolute inset-0 h-full w-full object-fill bg-white" />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_42%,#e2e8f0_100%)]" />
        )}

        {showGrid ? (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(14,165,233,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,165,233,0.18) 1px, transparent 1px)",
              backgroundSize: "5% 5%"
            }}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-full w-px bg-cyan-400/35" />
          <div className="absolute left-0 top-1/2 h-px w-full bg-cyan-400/35" />
        </div>

        <div className="absolute inset-0">
          {layout.fields.map((field) => {
            const background = toRgba(field.bgColor, field.bgOpacity)
            const isSelected = editable && selectedFieldId === field.id

            return (
              <div
                key={field.id}
                onMouseDown={(event) => beginDrag(field, event)}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelectField?.(field.id)
                }}
                className={`absolute ${editable ? (interactionMode === "place" ? "cursor-crosshair" : "cursor-move") : "cursor-default"} ${isSelected ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950/20" : ""}`}
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
                <FieldRenderer field={field} value={values[field.id] || ""} photoUrl={photoUrl} logoUrl={logoUrl} rows={rows} />

                {isSelected && editable ? (
                  <>
                    <ResizeHandle position="nw" onMouseDown={(event) => beginResize(field, "nw", event)} />
                    <ResizeHandle position="ne" onMouseDown={(event) => beginResize(field, "ne", event)} />
                    <ResizeHandle position="sw" onMouseDown={(event) => beginResize(field, "sw", event)} />
                    <ResizeHandle position="se" onMouseDown={(event) => beginResize(field, "se", event)} />
                  </>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ResizeHandle({
  position,
  onMouseDown
}: {
  position: "nw" | "ne" | "sw" | "se"
  onMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => void
}) {
  const positionStyle =
    position === "nw"
      ? "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"
      : position === "ne"
        ? "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"
        : position === "sw"
          ? "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"
          : "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize"

  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      className={`absolute h-3.5 w-3.5 rounded-full border border-white bg-cyan-400 shadow ${positionStyle}`}
      aria-label={`Resize ${position}`}
    />
  )
}

function FieldRenderer({
  field,
  value,
  photoUrl,
  logoUrl,
  rows
}: {
  field: DocumentField
  value: string
  photoUrl?: string | null
  logoUrl?: string | null
  rows: ReportRow[]
}) {
  if (field.type === "photo") {
    const activeImage = field.id === "schoolLogo" ? logoUrl : photoUrl

    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden bg-white/70" style={{ borderRadius: "inherit" }}>
        {activeImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeImage}
            alt={field.id === "schoolLogo" ? "School logo" : "Student"}
            className={`h-full w-full ${field.id === "schoolLogo" ? "object-contain p-1.5" : "object-cover"}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {field.id === "schoolLogo" ? "Logo" : "Photo"}
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
