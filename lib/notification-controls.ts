import { supabaseAdmin } from "@/lib/supabase-admin"

export const NOTIFICATION_CONTROLS_KEY = "notification_controls"

export type NotificationControls = {
  fee_notifications_enabled: boolean
  other_notifications_enabled: boolean
}

export const defaultNotificationControls: NotificationControls = {
  fee_notifications_enabled: true,
  other_notifications_enabled: true,
}

type SettingsRow = {
  id?: string | number | null
  value?: unknown
}

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

export function controlsFromValue(value: unknown): NotificationControls | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  return {
    fee_notifications_enabled: readBoolean(
      record.fee_notifications_enabled,
      defaultNotificationControls.fee_notifications_enabled
    ),
    other_notifications_enabled: readBoolean(
      record.other_notifications_enabled,
      defaultNotificationControls.other_notifications_enabled
    ),
  }
}

export function mergeNotificationControls<
  T extends {
    fee_notifications_enabled?: boolean | null
    other_notifications_enabled?: boolean | null
  },
>(
  row: T,
  fallback: NotificationControls | null
): T & NotificationControls {
  return {
    ...row,
    fee_notifications_enabled: fallback
      ? fallback.fee_notifications_enabled
      : readBoolean(row.fee_notifications_enabled, defaultNotificationControls.fee_notifications_enabled),
    other_notifications_enabled: fallback
      ? fallback.other_notifications_enabled
      : readBoolean(row.other_notifications_enabled, defaultNotificationControls.other_notifications_enabled),
  }
}

export async function getNotificationControls(schoolId: string) {
  if (!schoolId) return null

  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("value")
    .eq("school_id", schoolId)
    .eq("key", NOTIFICATION_CONTROLS_KEY)
    .maybeSingle()

  if (error) {
    console.error("Notification controls fetch error:", error)
    return null
  }

  return controlsFromValue(data?.value)
}

export async function getNotificationControlsMap(schoolIds: string[]) {
  const uniqueIds = Array.from(new Set(schoolIds.filter(Boolean)))
  if (uniqueIds.length === 0) return new Map<string, NotificationControls>()

  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("school_id,value")
    .in("school_id", uniqueIds)
    .eq("key", NOTIFICATION_CONTROLS_KEY)

  if (error) {
    console.error("Notification controls list error:", error)
    return new Map<string, NotificationControls>()
  }

  const map = new Map<string, NotificationControls>()
  for (const row of data || []) {
    const controls = controlsFromValue((row as { value?: unknown }).value)
    const schoolId = String((row as { school_id?: string | number | null }).school_id || "")
    if (schoolId && controls) map.set(schoolId, controls)
  }

  return map
}

export async function saveNotificationControls(schoolId: string, controls: NotificationControls) {
  if (!schoolId) return

  const value = {
    fee_notifications_enabled: Boolean(controls.fee_notifications_enabled),
    other_notifications_enabled: Boolean(controls.other_notifications_enabled),
  }

  const { data: existing, error: readError } = await supabaseAdmin
    .from("settings")
    .select("id")
    .eq("school_id", schoolId)
    .eq("key", NOTIFICATION_CONTROLS_KEY)
    .maybeSingle()

  if (readError) throw readError

  const query = (existing as SettingsRow | null)?.id
    ? supabaseAdmin
        .from("settings")
        .update({ value })
        .eq("school_id", schoolId)
        .eq("key", NOTIFICATION_CONTROLS_KEY)
    : supabaseAdmin.from("settings").insert({
        school_id: schoolId,
        key: NOTIFICATION_CONTROLS_KEY,
        value,
      })

  const { error } = await query
  if (error) throw error
}
