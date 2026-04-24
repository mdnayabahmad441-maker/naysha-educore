"use client"

import { supabase } from "@/lib/supabase"

type ApiFetchInit = RequestInit & {
  headers?: HeadersInit
}

export async function apiFetch(input: string, init: ApiFetchInit = {}) {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  const headers = new Headers(init.headers || {})

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
