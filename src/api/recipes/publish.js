// POST /api/recipes/publish { recipeId, action: "publish" | "unpublish" }, with the moderator's
// Supabase access token as a Bearer token. A Gatsby Function (a Netlify Function in production).
import { createClient } from "@supabase/supabase-js"
import { handlePublish } from "../../services/recipes/publish.js"

const PUBLIC_BUCKET = "recipe-images"
const UPLOADS = "recipe-uploads"

const createDeps = env => {
  const url = env.GATSBY_SUPABASE_URL
  const key = env.GATSBY_SUPABASE_PUBLISHABLE_KEY
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  const asUser = token =>
    createClient(url, key, {
      ...options,
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
  const admin = env.SUPABASE_SECRET_KEY
    ? createClient(url, env.SUPABASE_SECRET_KEY, options)
    : null

  return {
    canCopyImages: Boolean(admin),
    getUser: async token =>
      (await asUser(token).auth.getUser(token)).data?.user || null,
    getRole: async (token, id) =>
      (
        await asUser(token)
          .from("profiles")
          .select("role")
          .eq("id", id)
          .maybeSingle()
      ).data?.role,
    getRecipe: async (token, id) =>
      (
        await asUser(token)
          .from("recipes")
          .select("status, image_path, author_id")
          .eq("id", id)
          .maybeSingle()
      ).data,
    setStatus: async (token, id, status) => {
      const { error } = await asUser(token).rpc("change_recipe_status", {
        recipe: id,
        next_status: status,
      })
      return { ok: !error, message: error?.message }
    },
    copyImage: async path => {
      const { error } = await admin.storage
        .from(UPLOADS)
        .copy(path, path, { destinationBucket: PUBLIC_BUCKET })
      // Already there from an earlier publish: fine.
      if (error && !/exists|duplicate/i.test(error.message)) throw error
    },
    removeImage: async path => {
      if (admin) await admin.storage.from(PUBLIC_BUCKET).remove([path])
    },
    rebuild: async () => {
      if (!env.NETLIFY_BUILD_HOOK_URL) return false
      try {
        return (await fetch(env.NETLIFY_BUILD_HOOK_URL, { method: "POST" })).ok
      } catch {
        return false
      }
    },
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ ok: false, message: "Method not allowed" })
  }
  // Not `process.env`: Gatsby's bundler replaces that with the build-time values,
  // and the secrets must be read when the function runs.
  const env = globalThis.process.env
  if (!env.GATSBY_SUPABASE_URL || !env.GATSBY_SUPABASE_PUBLISHABLE_KEY)
    return res
      .status(503)
      .json({ ok: false, message: "Recipe submissions aren't set up" })

  const token = String(req.headers.authorization || "").replace(
    /^Bearer\s+/i,
    ""
  )
  const { status, json } = await handlePublish({
    token,
    body: req.body,
    deps: createDeps(env),
  })
  return res.status(status).json(json)
}
