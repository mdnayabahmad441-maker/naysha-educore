import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const MAX_LOGO_BYTES = 5 * 1024 * 1024
const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024

const configMap = {
  logo: {
    bucket: "school-logos",
    folder: "logos",
    settingsKey: null
  },
  "id-card-template": {
    bucket: "school-logos",
    folder: "id-card-templates",
    settingsKey: "id_card_template"
  },
  "report-card-template": {
    bucket: "school-logos",
    folder: "report-card-templates",
    settingsKey: "report_card_template"
  }
} as const

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const schoolId = formData.get("schoolId")
    const assetType = formData.get("assetType")
    const file = formData.get("file")

    if (
      typeof schoolId !== "string" ||
      typeof assetType !== "string" ||
      !(file instanceof File)
    ) {
      return NextResponse.json(
        { success: false, error: "schoolId, assetType and file are required" },
        { status: 400 }
      )
    }

    const config = configMap[assetType as keyof typeof configMap]

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Invalid asset type" },
        { status: 400 }
      )
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, error: "Please upload an image file" },
        { status: 400 }
      )
    }

    const maxBytes = assetType === "logo" ? MAX_LOGO_BYTES : MAX_TEMPLATE_BYTES
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          success: false,
          error: assetType === "logo"
            ? "School logo must be 5 MB or smaller"
            : "Template image must be 10 MB or smaller"
        },
        { status: 400 }
      )
    }

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()?.toLowerCase() || "png"
      : "png"
    const safeExtension = extension.replace(/[^a-zA-Z0-9]/g, "") || "png"
    const filePath = `${config.folder}/${schoolId}/${Date.now()}.${safeExtension}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(config.bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: true
      })

    if (uploadError) {
      console.error("School asset upload error:", uploadError)
      return NextResponse.json(
        { success: false, error: uploadError.message },
        { status: 500 }
      )
    }

    const { data } = supabaseAdmin.storage.from(config.bucket).getPublicUrl(filePath)
    const publicUrl = data.publicUrl

    if (assetType === "logo") {
      const { error: schoolError } = await supabaseAdmin
        .from("schools")
        .update({ logo_url: publicUrl })
        .eq("id", schoolId)

      if (schoolError) {
        console.error("School logo update error:", schoolError)
        return NextResponse.json(
          { success: false, error: schoolError.message },
          { status: 500 }
        )
      }
    } else if (config.settingsKey) {
      const { error: settingsError } = await supabaseAdmin
        .from("settings")
        .upsert(
          {
            school_id: schoolId,
            key: config.settingsKey,
            value: publicUrl
          },
          {
            onConflict: "school_id,key"
          }
        )

      if (settingsError) {
        console.error("School asset settings update error:", settingsError)
        return NextResponse.json(
          { success: false, error: settingsError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl
    })
  } catch (err: any) {
    console.error("School asset API error:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upload asset" },
      { status: 500 }
    )
  }
}
