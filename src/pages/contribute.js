import React, { useCallback, useEffect, useState } from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SignedIn from "../components/SignedIn"
import { STATUS_LABELS, errorMessage, getSupabase } from "../lib/supabase"

const STATUS_HELP = {
  draft: "Only you can see this",
  submitted: "Waiting for a moderator",
  under_review: "A moderator is reviewing it",
  approved: "Approved, appears on the site after the next publish",
  rejected: "A moderator asked for changes",
  published: "Live on Sizzle",
}

const DisplayName = ({ userId }) => {
  const [name, setName] = useState("")
  const [saved, setSaved] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    getSupabase()
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        setName(data?.display_name || "")
        setSaved(data?.display_name || "")
      })
  }, [userId])

  const save = async event => {
    event.preventDefault()
    const { error } = await getSupabase()
      .from("profiles")
      .update({ display_name: name.trim() })
      .eq("id", userId)
    setMessage(error ? "Use 1 to 60 characters" : "Saved")
    if (!error) setSaved(name.trim())
  }

  return (
    <form onSubmit={save} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="display-name" className="text-sm font-semibold">
          Name shown on your recipes
        </label>
        <input
          id="display-name"
          value={name}
          maxLength={60}
          onChange={event => {
            setName(event.target.value)
            setMessage("")
          }}
          className="input mt-1 w-64"
        />
      </div>
      <button
        type="submit"
        className="btn-quiet"
        disabled={!name.trim() || name.trim() === saved}
      >
        Save name
      </button>
      <p className="w-full text-sm text-muted" aria-live="polite">
        {message}
      </p>
    </form>
  )
}

const Dashboard = ({ session }) => {
  const [recipes, setRecipes] = useState(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()
      .from("recipes")
      .select("id, title, status, review_note, updated_at")
      .eq("author_id", session.user.id)
      .order("updated_at", { ascending: false })
    if (error)
      setError("Your recipes couldn't be loaded. Refresh to try again.")
    else setRecipes(data)
  }, [session.user.id])

  useEffect(() => {
    load()
  }, [load])

  const withdraw = async id => {
    const { error } = await getSupabase().rpc("change_recipe_status", {
      recipe: id,
      next_status: "draft",
    })
    if (error) setError(errorMessage(error, "That didn't work. Try again."))
    load()
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DisplayName userId={session.user.id} />
        <Link to="/contribute/edit/" className="btn-primary">
          New recipe
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-6 font-semibold text-danger">
          {error}
        </p>
      )}

      {recipes === null ? (
        <p className="mt-10 text-muted" role="status">
          Loading your recipes…
        </p>
      ) : recipes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center">
          <h2 className="text-display-sm">No recipes yet</h2>
          <p className="mt-2 text-muted">
            Write one up and send it for review when it's ready
          </p>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-line rounded-2xl border border-line bg-surface">
          {recipes.map(recipe => {
            const editable = ["draft", "rejected"].includes(recipe.status)
            return (
              <li
                key={recipe.id}
                className="flex flex-wrap items-start justify-between gap-4 p-5"
              >
                <div className="min-w-0">
                  <h2 className="font-semibold">
                    {recipe.title || "Untitled recipe"}
                  </h2>
                  <p className="mt-1 text-sm">
                    <span
                      className={`chip ${recipe.status === "rejected" ? "border-danger/40 text-danger" : ""}`}
                    >
                      {STATUS_LABELS[recipe.status]}
                    </span>{" "}
                    <span className="text-muted">
                      {STATUS_HELP[recipe.status]}
                    </span>
                  </p>
                  {recipe.status === "rejected" && recipe.review_note && (
                    <p className="mt-2 rounded-lg bg-saffron-soft px-3 py-2 text-sm">
                      <span className="font-semibold">Moderator: </span>
                      {recipe.review_note}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {recipe.status === "submitted" && (
                    <button
                      type="button"
                      className="btn-quiet"
                      onClick={() => withdraw(recipe.id)}
                    >
                      Withdraw
                    </button>
                  )}
                  <Link
                    to={`/contribute/edit/?id=${recipe.id}`}
                    className="btn-quiet"
                  >
                    {editable ? "Edit" : "View"}
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <button
        type="button"
        className="link mt-10 text-sm"
        onClick={() => getSupabase().auth.signOut()}
      >
        Sign out
      </button>
    </>
  )
}

const ContributePage = () => (
  <Layout>
    <section className="page max-w-4xl py-12">
      <h1 className="text-display-md">Your recipes</h1>
      <p className="mt-2 text-muted">
        Recipes are checked by a moderator before they appear on Sizzle. Once
        published, they can't be edited.
      </p>
      <div className="mt-8">
        <SignedIn>{session => <Dashboard session={session} />}</SignedIn>
      </div>
    </section>
  </Layout>
)

export const Head = () => <Seo title="Your recipes" />

export default ContributePage
