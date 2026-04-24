import { supabase } from "./supabase"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function waitForSession(maxAttempts = 8, delayMs = 250) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await supabase.auth.getSession()

    if (data.session && !error) {
      return data.session
    }

    await wait(delayMs)
  }

  return null
}

export async function waitForUser(maxAttempts = 8, delayMs = 250) {
  const session = await waitForSession(maxAttempts, delayMs)

  if (session?.user) {
    return session.user
  }

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { data, error } = await supabase.auth.getUser()

    if (data.user && !error) {
      return data.user
    }

    await wait(delayMs)
  }

  return null
}
