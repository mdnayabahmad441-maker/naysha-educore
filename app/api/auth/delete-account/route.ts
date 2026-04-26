import { NextResponse } from "next/server"
import { requireAuthorizedProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function DELETE(request: Request) {
  const auth = await requireAuthorizedProfile(request, ["admin", "teacher", "parent"])

  if ("response" in auth) {
    return auth.response
  }

  const { userId, role } = auth.profile

  try {
    await Promise.all([
      supabaseAdmin.from("profiles").delete().eq("id", userId),
      role === "teacher"
        ? supabaseAdmin.from("teachers").update({ auth_id: null }).eq("auth_id", userId)
        : Promise.resolve(),
      role === "parent"
        ? supabaseAdmin.from("parents").update({ auth_id: null }).eq("auth_id", userId)
        : Promise.resolve(),
    ])

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 500 }
    )
  }
}
