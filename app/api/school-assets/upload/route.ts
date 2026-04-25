import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { ensureSameSchool, requireAdminProfile } from "@/lib/api-auth"

const MAX_LOGO_BYTES = 5 * 1024 * 1024
const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024

const configMap = {
  logo: {
    bucket: "school-logos",
    folder: "logos",
    settingsKey: null,
  },
  "id-card-template": {
    bucket: "school-logos",
    folder: "id-card-templates",
    settingsKey: "id_card_template",
  },
  "report-card-template": {
    bucket: "school-logos",
    folder: "report-card-templates",
    settingsKey: "report_card_template",
  },
  "certificate-template": {
    bucket: "school-logos",
    folder: "certificate-templates",
    settingsKey: "certificate_template",
  },
} as const

function getConfig(assetType: string) {
  return configMap[assetType as keyof typeof configMap] || null
}

function extractStoragePath(publicUrl: string, bucket: string) {
  try {
    const pathname = new URL(publicUrl).pathname
    const marker = `/storage/v1/object/public/${bucket}/`
    const index = pathname.indexOf(marker)

    if (index === -1) return null

    return decodeURIComponent(pathname.slice(index + marker.length))
  } catch {
    return null
  }
}

async function clearAssetReference(schoolId: string, assetType: keyof typeof configMap) {
  const config = getConfig(assetType)

  if (!config) {
    return NextResponse.json(
      { success: false, error: "Invalid asset type" },
      { status: 400 }
    )
  }

  if (assetType === "logo") {
    const { error } = await supabaseAdmin
      .from("schools")
      .update({ logo_url: null })
      .eq("id", schoolId)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return null
  }

  if (config.settingsKey) {
    const { error } = await supabaseAdmin
      .from("settings")
      .delete()
      .eq("school_id", schoolId)
      .eq("key", config.settingsKey)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }

  return null
}

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

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

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) {
      return schoolMismatch
    }

    const config = getConfig(assetType)

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
            : "Template image must be 10 MB or smaller",
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
        upsert: true,
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
            value: publicUrl,
          },
          {
            onConflict: "school_id,key",
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
      url: publicUrl,
    })
  } catch (err: any) {
    console.error("School asset API error:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Failed to upload asset" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const body = await req.json()
    const schoolId = typeof body?.schoolId === "string" ? body.schoolId : null
    const assetType = typeof body?.assetType === "string" ? body.assetType : null
    const currentUrl = typeof body?.currentUrl === "string" ? body.currentUrl : ""

    if (!schoolId || !assetType) {
      return NextResponse.json(
        { success: false, error: "schoolId and assetType are required" },
        { status: 400 }
      )
    }

    const schoolMismatch = ensureSameSchool(authResult.profile, schoolId)
    if (schoolMismatch) {
      return schoolMismatch
    }

    const config = getConfig(assetType)

    if (!config) {
      return NextResponse.json(
        { success: false, error: "Invalid asset type" },
        { status: 400 }
      )
    }

    const storagePath = currentUrl ? extractStoragePath(currentUrl, config.bucket) : null

    if (storagePath) {
      const { error: removeError } = await supabaseAdmin.storage
        .from(config.bucket)
        .remove([storagePath])

      if (removeError) {
        console.error("School asset delete error:", removeError)
      }
    }

    const clearResponse = await clearAssetReference(schoolId, assetType as keyof typeof configMap)

    if (clearResponse) {
      return clearResponse
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("School asset delete API error:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete asset" },
      { status: 500 }
    )
  }
}
