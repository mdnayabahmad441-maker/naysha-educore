import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminProfile } from "@/lib/api-auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminProfile(req)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) return NextResponse.json({ error: "No school linked" }, { status: 400 })

  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from("admissions")
    .select("*")
    .eq("id", id)
    .eq("school_id", schoolId)
    .single()

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ admission: data })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminProfile(req)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) return NextResponse.json({ error: "No school linked" }, { status: 400 })

  const { id }   = await params
  const body     = await req.json()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.status  !== undefined) updates.status  = body.status
  if (body.remarks !== undefined) updates.remarks = body.remarks

  const { data, error } = await supabaseAdmin
    .from("admissions")
    .update(updates)
    .eq("id", id)
    .eq("school_id", schoolId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ admission: data })
}
