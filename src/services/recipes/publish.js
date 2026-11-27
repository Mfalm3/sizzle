// Publishing and unpublishing a community recipe. Runs on the server because it needs two things
// the browser must never hold: the Supabase secret key (to copy the photo from the private uploads
// bucket into the public one) and the Netlify build hook (to rebuild the static site).
//
// The status change itself runs as the moderator, with their own session, so the database's
// change_recipe_status function still decides whether it's allowed.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const reply = (status, json) => ({
  status,
  json: { ok: status < 300, ...json },
})

/**
 * `deps` talks to Supabase and Netlify (see src/api/recipes/publish.js); injected so the rules here
 * can be tested without either.
 */
export const handlePublish = async ({ token, body, deps, log = console }) => {
  const { recipeId, action } = body || {}
  if (
    !UUID.test(String(recipeId)) ||
    !["publish", "unpublish"].includes(action)
  )
    return reply(400, { message: "Bad request" })
  if (!token) return reply(401, { message: "Sign in again" })

  const user = await deps.getUser(token)
  if (!user) return reply(401, { message: "Sign in again" })
  if ((await deps.getRole(token, user.id)) !== "moderator")
    return reply(403, { message: "Only moderators can publish recipes" })

  const recipe = await deps.getRecipe(token, recipeId)
  if (!recipe) return reply(404, { message: "Recipe not found" })
  const publishing = action === "publish"
  if (recipe.status !== (publishing ? "approved" : "published"))
    return reply(409, {
      message: publishing
        ? "Only approved recipes can be published"
        : "That recipe isn't published",
    })

  // A photo must sit in its author's folder; anything else is refused rather than made public.
  const photo = recipe.image_path
  if (photo && !photo.startsWith(`${recipe.author_id}/`))
    return reply(422, { message: "The recipe's photo is in the wrong place" })
  if (photo && publishing && !deps.canCopyImages)
    return reply(503, {
      message: "Publishing photos isn't set up yet (SUPABASE_SECRET_KEY)",
    })

  try {
    if (photo && publishing) await deps.copyImage(photo)
    const changed = await deps.setStatus(
      token,
      recipeId,
      publishing ? "published" : "approved"
    )
    if (!changed.ok) {
      if (photo && publishing) await deps.removeImage(photo)
      return reply(409, { message: changed.message })
    }
    if (photo && !publishing) await deps.removeImage(photo)
  } catch (error) {
    log.error("recipes: publish failed:", error?.message || error)
    return reply(502, { message: "That didn't work. Try again in a minute." })
  }

  const rebuilt = await deps.rebuild()
  return reply(200, {
    status: publishing ? "published" : "approved",
    message: rebuilt
      ? publishing
        ? "Published. It appears on the site after the rebuild, in a few minutes."
        : "Unpublished. It leaves the site after the rebuild, in a few minutes."
      : "Saved, but the site didn't rebuild. Trigger a deploy in Netlify.",
  })
}
