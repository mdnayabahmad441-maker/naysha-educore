import { supabase } from "./supabase"

export async function waitForUser(maxAttempts = 10, delayMs = 300) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await supabase.auth.getUser()
    
    if (data.user) {
      return data.user
    }
    
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return null
}

export async function waitForSession(maxAttempts = 10, delayMs = 300) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const { data } = await supabase.auth.getSession()
    
    if (data.session) {
      return data.session
    }
    
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return null
}
