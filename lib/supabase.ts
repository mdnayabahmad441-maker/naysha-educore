import { createClient } from "@supabase/supabase-js"
import { authCookieStorage, getAuthStorageKey } from "./auth-storage"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? authCookieStorage : undefined,
      storageKey: typeof window !== "undefined" ? getAuthStorageKey() : "naysha-auth-token"
    }
  }
)
