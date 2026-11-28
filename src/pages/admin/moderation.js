import React, { useCallback, useEffect, useState } from "react"
import { Link } from "gatsby"

import Seo from "../../components/seo"
import SignedIn from "../../components/SignedIn"
import { Logo } from "../../components/header"
import {
  STATUS_LABELS,
  UPLOADS,
  errorMessage,
  getSupabase,
} from "../../lib/supabase"

const QUEUES = [
  "submitted",
  "under_review",
  "approved",
  "published",
  "rejected",
]

const Detail = ({ recipe, ownRecipe, onDone }) => {
  const [photoUrl, setPhotoUrl] = useState(null)
  const [note, setNote] = useState("")
  const [state, setState] = useState({ status: "idle" })

  useEffect(() => {
    if (!recipe.image_path) return
    getSupabase()
      .storage.from(UPLOADS)
      .createSignedUrl(recipe.image_path, 600)
      .then(({ data }) => setPhotoUrl(data?.signedUrl || null))
  }, [recipe.image_path])

  const move = async next_status => {
    setState({ status: "busy" })
    const { error } = await getSupabase().rpc("change_recipe_status", {
      recipe: recipe.id,
      next_status,
      reason: note,
    })
    if (error)
      return setState({
        status: "error",
        message: errorMessage(error, "That didn't work. Try again."),
      })
    onDone(
      `${recipe.title || "Recipe"} is now ${STATUS_LABELS[next_status].toLowerCase()}`
    )
  }

  // Publishing copies the photo to public storage and rebuilds the site, so it runs on the server.
  const publish = async action => {
    setState({ status: "busy" })
    const { data } = await getSupabase().auth.getSession()
    try {
      const response = await fetch("/api/recipes/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session?.access_token}`,
        },
        body: JSON.stringify({ recipeId: recipe.id, action }),
      })
      const result = await response.json()
      if (!result.ok)
        return setState({ status: "error", message: result.message })
      onDone(result.message)
    } catch {
      setState({
        status: "error",
        message: "Couldn't reach the server. Try again.",
      })
    }
  }

  const busy = state.status === "busy"
  const reviewing = ["submitted", "under_review"].includes(recipe.status)
  // The database refuses self-review; say so instead of offering buttons that would fail.
  const selfReview = reviewing && ownRecipe

  return (
    <div className="grid gap-6 border-t border-line p-5 lg:grid-cols-[1fr_16rem]">
      <div className="space-y-4">
        {recipe.description && <p>{recipe.description}</p>}
        <p className="text-sm text-muted">
          {recipe.category}
          {recipe.cuisine && `, ${recipe.cuisine}`}
        </p>
        <div>
          <h3 className="font-semibold">Ingredients</h3>
          <ul className="mt-1 list-disc pl-5">
            {recipe.ingredients.map((i, n) => (
              <li key={n}>
                {i.measure} {i.name}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Method</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {recipe.method
              .flatMap(s => s.steps)
              .map((step, n) => (
                <li key={n}>{step}</li>
              ))}
          </ol>
        </div>
        {recipe.review_note && (
          <p className="text-sm">
            <span className="font-semibold">Review note: </span>
            {recipe.review_note}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {recipe.image_path &&
          (photoUrl ? (
            <img
              src={photoUrl}
              alt="Submitted photo"
              className="w-full rounded-xl object-cover"
            />
          ) : (
            <p className="text-sm text-muted">Loading photo…</p>
          ))}

        {selfReview && (
          <p className="rounded-lg bg-saffron-soft p-3 text-sm">
            This is your own recipe, so another moderator has to review it
          </p>
        )}
        {reviewing && !selfReview && (
          <>
            <div>
              <label
                htmlFor={`note-${recipe.id}`}
                className="text-sm font-semibold"
              >
                Note to the author
              </label>
              <p className="text-sm text-muted">Required to ask for changes</p>
              <textarea
                id={`note-${recipe.id}`}
                rows={3}
                maxLength={2000}
                value={note}
                onChange={e => setNote(e.target.value)}
                className="input mt-1"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => move("approved")}
              >
                Approve
              </button>
              <button
                type="button"
                className="btn-quiet"
                disabled={busy || !note.trim()}
                onClick={() => move("rejected")}
              >
                Ask for changes
              </button>
              {recipe.status === "submitted" && (
                <button
                  type="button"
                  className="link text-sm"
                  disabled={busy}
                  onClick={() => move("under_review")}
                >
                  Mark as in review
                </button>
              )}
            </div>
          </>
        )}
        {recipe.status === "approved" && (
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => publish("publish")}
          >
            Publish
          </button>
        )}
        {recipe.status === "published" && (
          <button
            type="button"
            className="btn-quiet"
            disabled={busy}
            onClick={() => publish("unpublish")}
          >
            Unpublish
          </button>
        )}
        {state.status === "error" && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {state.message}
          </p>
        )}
      </div>
    </div>
  )
}

const Queue = ({ session }) => {
  const [role, setRole] = useState(undefined)
  const [queue, setQueue] = useState("submitted")
  const [recipes, setRecipes] = useState(null)
  const [open, setOpen] = useState(null)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    getSupabase()
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setRole(data?.role || null))
  }, [session.user.id])

  const load = useCallback(async () => {
    setRecipes(null)
    const { data } = await getSupabase()
      .from("recipes")
      .select(
        "id, title, description, category, cuisine, ingredients, method, image_path, status, review_note, submitted_at, author_id, author:profiles!recipes_author_id_fkey(display_name)"
      )
      .eq("status", queue)
      .order("submitted_at", { ascending: true })
    setRecipes(data || [])
  }, [queue])

  useEffect(() => {
    if (role === "moderator") load()
  }, [role, load])

  if (role === undefined) return <p className="text-muted">Loading…</p>
  if (role !== "moderator")
    return (
      <p>This page is for moderators. Ask an existing moderator for access.</p>
    )

  return (
    <>
      <div
        role="group"
        aria-label="Show recipes that are"
        className="flex flex-wrap gap-2"
      >
        {QUEUES.map(key => (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={queue === key}
            onClick={() => {
              setQueue(key)
              setOpen(null)
            }}
          >
            {STATUS_LABELS[key]}
          </button>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted" aria-live="polite">
        {notice}
      </p>
      {recipes === null ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : recipes.length === 0 ? (
        <p className="mt-6 text-muted">Nothing here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line bg-paper">
          {recipes.map(recipe => (
            <li key={recipe.id}>
              <button
                type="button"
                aria-expanded={open === recipe.id}
                onClick={() => setOpen(open === recipe.id ? null : recipe.id)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left"
              >
                <span>
                  <span className="font-semibold">
                    {recipe.title || "Untitled"}
                  </span>
                  <span className="block text-sm text-muted">
                    by {recipe.author?.display_name}
                    {recipe.submitted_at &&
                      `, sent ${new Date(recipe.submitted_at).toLocaleDateString()}`}
                  </span>
                </span>
                <span className="text-sm text-muted">
                  {open === recipe.id ? "Close" : "Open"}
                </span>
              </button>
              {open === recipe.id && (
                <Detail
                  recipe={recipe}
                  ownRecipe={recipe.author_id === session.user.id}
                  onDone={message => {
                    setNotice(message)
                    setOpen(null)
                    load()
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const ModerationPage = () => (
  <div className="min-h-screen bg-surface">
    <header className="border-b border-line bg-ink text-surface">
      <div className="page flex h-14 items-center justify-between">
        <div className="flex items-center gap-3 [&_a]:text-xl">
          <Logo siteTitle="Sizzle" />
          <span className="rounded-full bg-surface/10 px-2.5 py-0.5 text-xs font-semibold">
            Moderation
          </span>
        </div>
        <Link
          to="/admin/"
          className="text-sm text-surface/80 hover:text-surface"
        >
          Content overview
        </Link>
      </div>
    </header>
    <main id="main" className="page py-10">
      <h1 className="font-sans text-2xl font-semibold">Community recipes</h1>
      <p className="mt-1 text-sm text-muted">
        Approve or ask for changes, then publish. Moderators can't review their
        own recipes.
      </p>
      <div className="mt-8">
        <SignedIn>{session => <Queue session={session} />}</SignedIn>
      </div>
    </main>
  </div>
)

export const Head = () => <Seo title="Moderation" />

export default ModerationPage
