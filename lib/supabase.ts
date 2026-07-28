import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { authSessionStorage, getAuthStorageKey } from "./auth-storage"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? authSessionStorage : undefined,
      storageKey: typeof window !== "undefined" ? getAuthStorageKey() : "naysha-auth-token"
    }
  })
}

const globalForSupabase = globalThis as typeof globalThis & {
  __nayshaSupabase?: SupabaseClient
}

export const supabase =
  typeof window === "undefined"
    ? createSupabaseClient()
    : (globalForSupabase.__nayshaSupabase ??= createSupabaseClient())
