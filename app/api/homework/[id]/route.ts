import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAuthorizedProfile } from "@/lib/api-auth"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthorizedProfile(req, ["admin", "teacher"])
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) return NextResponse.json({ error: "No school linked" }, { status: 400 })

  const { id } = await params

  const { error } = await supabaseAdmin
    .from("homework")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthorizedProfile(req, ["admin", "teacher"])
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) return NextResponse.json({ error: "No school linked" }, { status: 400 })

  const { id }   = await params
  const body     = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.title       !== undefined) updates.title       = body.title
  if (body.description !== undefined) updates.description = body.description
  if (body.due_date    !== undefined) updates.due_date    = body.due_date
  if (body.subject     !== undefined) updates.subject     = body.subject

  const { data, error } = await supabaseAdmin
    .from("homework")
    .update(updates)
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("*, classes:class_id(name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ homework: data })
}
