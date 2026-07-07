export const SUPER_ADMIN_EMAIL = "groenics@gmail.com"

export function isSuperAdminEmail(email: string | null | undefined) {
  return String(email || "").trim().toLowerCase() === SUPER_ADMIN_EMAIL
}
