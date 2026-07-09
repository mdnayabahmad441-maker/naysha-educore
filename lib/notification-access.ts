import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getNotificationControls } from "@/lib/notification-controls"

type NotificationKind = "fee" | "general"

function getDisabledMessage(kind: NotificationKind) {
  return kind === "fee"
    ? "Fee notifications are disabled for this school."
    : "Other notifications are disabled for this school."
}

export async function requireNotificationEnabled(schoolId: string, kind: NotificationKind) {
  if (!schoolId) {
    return NextResponse.json({ error: "School is required for notifications" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("fee_notifications_enabled, other_notifications_enabled")
    .eq("id", schoolId)
    .maybeSingle()

  if (error) {
    const text = `${error.code || ""} ${error.message || ""} ${error.details || ""}`.toLowerCase()
    if (text.includes("column") || text.includes("schema cache") || error.code === "42703" || error.code === "PGRST204") {
      const controls = await getNotificationControls(schoolId)
      const fallbackEnabled = kind === "fee"
        ? controls?.fee_notifications_enabled !== false
        : controls?.other_notifications_enabled !== false

      return fallbackEnabled ? null : NextResponse.json({ error: getDisabledMessage(kind) }, { status: 403 })
    }

    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const controls = await getNotificationControls(schoolId)
  const enabled = kind === "fee"
    ? controls?.fee_notifications_enabled ?? data?.fee_notifications_enabled !== false
    : controls?.other_notifications_enabled ?? data?.other_notifications_enabled !== false

  if (!enabled) {
    return NextResponse.json({ error: getDisabledMessage(kind) }, { status: 403 })
  }

  return null
}
