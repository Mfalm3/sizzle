// The Supabase client for contributor accounts and recipe submissions. It uses the publishable key,
// which is public by design: what each person can read or change is enforced by the database's
// row level security (supabase/migrations), never by this code.
import { useSyncExternalStore } from "react"
import { createClient } from "@supabase/supabase-js"

const URL = process.env.GATSBY_SUPABASE_URL
const KEY = process.env.GATSBY_SUPABASE_PUBLISHABLE_KEY

// Contributions only appear once the project is configured for the build.
export const CONTRIBUTIONS_ENABLED = Boolean(URL && KEY)

let client
export const getSupabase = () => {
  if (!CONTRIBUTIONS_ENABLED || typeof window === "undefined") return null
  client ??= createClient(URL, KEY, {
    auth: { flowType: "pkce", detectSessionInUrl: true },
  })
  return client
}

export const UPLOADS = "recipe-uploads"
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"]

export const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "In review",
  approved: "Approved",
  rejected: "Changes needed",
  published: "Published",
}

// Session state: `undefined` while loading (and on the server), `null` when signed out.
let session
const listeners = new Set()
let started = false

const start = () => {
  if (started) return
  started = true
  const supabase = getSupabase()
  if (!supabase) {
    session = null
    return
  }
  supabase.auth.onAuthStateChange((_event, next) => {
    session = next
    listeners.forEach(notify => notify())
  })
}

const subscribe = notify => {
  start()
  listeners.add(notify)
  return () => listeners.delete(notify)
}

export const useSession = () =>
  useSyncExternalStore(
    subscribe,
    () => session,
    () => undefined
  )

// Supabase errors carry the database's message (our functions write them for people to read).
export const errorMessage = (error, fallback) =>
  error?.code === "P0001" ||
  error?.code === "22023" ||
  error?.code === "42501" ||
  error?.code === "P0002"
    ? error.message
    : fallback
