import React, { useEffect, useState } from "react"
import { Link, graphql, navigate } from "gatsby"

import Layout from "../../components/layout"
import Seo from "../../components/seo"
import SignedIn from "../../components/SignedIn"
import Icon from "../../components/Icon"
import {
  MAX_PHOTO_BYTES,
  PHOTO_TYPES,
  STATUS_LABELS,
  UPLOADS,
  errorMessage,
  getSupabase,
} from "../../lib/supabase"

const BLANK = {
  title: "",
  description: "",
  category: "",
  cuisine: "",
  ingredients: [{ name: "", measure: "" }],
  steps: "",
  image_path: null,
  status: "draft",
}

// The form keeps steps as one block of text, a step per line; the database stores the site's
// method shape, [{ title, steps }].
const fromRow = row => ({
  ...row,
  ingredients: row.ingredients.length
    ? row.ingredients
    : [{ name: "", measure: "" }],
  steps: row.method.flatMap(section => section.steps).join("\n"),
})
const toRow = form => ({
  title: form.title.trim(),
  description: form.description.trim(),
  category: form.category,
  cuisine: form.cuisine.trim(),
  ingredients: form.ingredients
    .map(i => ({ name: i.name.trim(), measure: i.measure.trim() }))
    .filter(i => i.name),
  method: [
    {
      title: null,
      steps: form.steps
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean),
    },
  ],
  image_path: form.image_path,
})

// The same checks the database makes on submit, so people hear about them before trying.
const missingForSubmit = row =>
  [
    !row.title && "a title",
    !row.category && "a category",
    !row.image_path && "a photo",
    !row.ingredients.length && "at least one ingredient",
    !row.method[0].steps.length && "at least one step",
  ].filter(Boolean)

const Field = ({ id, label, hint, children }) => (
  <div>
    <label htmlFor={id} className="text-sm font-semibold">
      {label}
    </label>
    {hint && <p className="text-sm text-muted">{hint}</p>}
    <div className="mt-1.5">{children}</div>
  </div>
)

const Editor = ({ session, categories, cuisines }) => {
  const [id, setId] = useState(null)
  const [form, setForm] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [state, setState] = useState({ status: "idle" })

  useEffect(() => {
    const existing = new URLSearchParams(window.location.search).get("id")
    if (!existing) return setForm(BLANK)
    getSupabase()
      .from("recipes")
      .select(
        "id, title, description, category, cuisine, ingredients, method, image_path, status, review_note"
      )
      .eq("id", existing)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return setState({ status: "missing" })
        setId(data.id)
        setForm(fromRow(data))
      })
  }, [])

  // Uploads are private, so previews use a short-lived signed link.
  useEffect(() => {
    if (!form?.image_path) return setPhotoUrl(null)
    getSupabase()
      .storage.from(UPLOADS)
      .createSignedUrl(form.image_path, 3600)
      .then(({ data }) => setPhotoUrl(data?.signedUrl || null))
  }, [form?.image_path])

  if (state.status === "missing")
    return (
      <p>
        That recipe doesn't exist or isn't yours.{" "}
        <Link to="/contribute/" className="link">
          Back to your recipes
        </Link>
      </p>
    )
  if (!form)
    return (
      <p className="text-muted" role="status">
        Loading…
      </p>
    )

  const editable = ["draft", "rejected"].includes(form.status)
  const busy = state.status === "saving"
  const stepCount = toRow(form).method[0].steps.length
  const set = changes => setForm(current => ({ ...current, ...changes }))
  const setIngredient = (index, changes) =>
    set({
      ingredients: form.ingredients.map((item, i) =>
        i === index ? { ...item, ...changes } : item
      ),
    })

  const upload = async file => {
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type))
      return setState({
        status: "error",
        message: "Use a JPEG, PNG or WebP photo",
      })
    if (file.size > MAX_PHOTO_BYTES)
      return setState({
        status: "error",
        message: "Photos can be up to 5 MB. Try a smaller one.",
      })
    setState({ status: "saving", message: "Uploading photo…" })
    const ext = file.type.split("/")[1].replace("jpeg", "jpg")
    const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`
    const { error } = await getSupabase()
      .storage.from(UPLOADS)
      .upload(path, file, { contentType: file.type })
    if (error)
      return setState({
        status: "error",
        message: "The photo didn't upload. Try again.",
      })
    set({ image_path: path })
    setState({ status: "idle", message: "Photo added. Save to keep it." })
  }

  // Saves the draft and returns its id, creating the row on first save.
  const save = async () => {
    const row = toRow(form)
    const supabase = getSupabase()
    const { data, error } = id
      ? await supabase
          .from("recipes")
          .update(row)
          .eq("id", id)
          .select("id")
          .single()
      : await supabase.from("recipes").insert(row).select("id").single()
    if (error) throw error
    if (!id) {
      setId(data.id)
      window.history.replaceState(null, "", `?id=${data.id}`)
    }
    return data.id
  }

  const run = async (action, done) => {
    setState({ status: "saving" })
    try {
      await action()
      setState({ status: "idle", message: done })
    } catch (error) {
      setState({
        status: "error",
        message: errorMessage(
          error,
          "That didn't save. Check your connection and try again."
        ),
      })
    }
  }

  const submit = () => {
    const missing = missingForSubmit(toRow(form))
    if (missing.length)
      return setState({
        status: "error",
        message: `Add ${missing.join(", ")} before sending it for review`,
      })
    run(async () => {
      const recipeId = await save()
      const { error } = await getSupabase().rpc("change_recipe_status", {
        recipe: recipeId,
        next_status: "submitted",
      })
      if (error) throw error
      navigate("/contribute/")
    })
  }

  const remove = () => {
    if (!window.confirm("Delete this recipe? This can't be undone.")) return
    run(async () => {
      const supabase = getSupabase()
      if (id) {
        const { error } = await supabase.from("recipes").delete().eq("id", id)
        if (error) throw error
      }
      if (form.image_path)
        await supabase.storage.from(UPLOADS).remove([form.image_path])
      navigate("/contribute/")
    })
  }

  if (!editable)
    return (
      <article className="space-y-4">
        <p>
          <span className="chip">{STATUS_LABELS[form.status]}</span>{" "}
          <span className="text-muted">
            Recipes can't be changed once they're sent for review.
          </span>
        </p>
        <h2 className="text-display-sm">{form.title}</h2>
        {photoUrl && (
          <img src={photoUrl} alt="" className="w-64 rounded-xl object-cover" />
        )}
        <p>{form.description}</p>
        <ul className="list-disc pl-5">
          {form.ingredients.map((i, n) => (
            <li key={n}>
              {i.measure} {i.name}
            </li>
          ))}
        </ul>
        <ol className="list-decimal space-y-2 pl-5">
          {form.steps.split("\n").map((s, n) => (
            <li key={n}>{s}</li>
          ))}
        </ol>
        <Link to="/contribute/" className="link">
          Back to your recipes
        </Link>
      </article>
    )

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        run(save, "Draft saved")
      }}
      className="space-y-8"
    >
      {form.status === "rejected" && form.review_note && (
        <p className="rounded-xl bg-saffron-soft p-4">
          <span className="font-semibold">Moderator: </span>
          {form.review_note}
        </p>
      )}

      <Field id="title" label="Recipe name">
        <input
          id="title"
          value={form.title}
          maxLength={120}
          onChange={e => set({ title: e.target.value })}
          className="input"
        />
      </Field>

      <Field
        id="description"
        label="Description"
        hint="Optional. What makes it worth cooking?"
      >
        <textarea
          id="description"
          value={form.description}
          maxLength={1000}
          rows={3}
          onChange={e => set({ description: e.target.value })}
          className="input"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2 sm:items-end">
        <Field id="category" label="Category">
          <select
            id="category"
            value={form.category}
            onChange={e => set({ category: e.target.value })}
            className="select"
          >
            <option value="">Choose one</option>
            {categories.map(name => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </Field>
        <Field id="cuisine" label="Cuisine" hint="Optional">
          <input
            id="cuisine"
            list="cuisine-options"
            value={form.cuisine}
            maxLength={60}
            onChange={e => set({ cuisine: e.target.value })}
            className="input"
          />
          <datalist id="cuisine-options">
            {cuisines.map(name => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">Ingredients</legend>
        <ul className="mt-2 space-y-2">
          {form.ingredients.map((item, index) => (
            <li key={index} className="flex gap-2">
              <input
                aria-label={`Ingredient ${index + 1}`}
                placeholder="Ingredient"
                value={item.name}
                maxLength={80}
                onChange={e => setIngredient(index, { name: e.target.value })}
                className="input flex-[2]"
              />
              <input
                aria-label={`Amount for ingredient ${index + 1}`}
                placeholder="Amount"
                value={item.measure}
                maxLength={40}
                onChange={e =>
                  setIngredient(index, { measure: e.target.value })
                }
                className="input flex-1"
              />
              <button
                type="button"
                className="btn-icon"
                aria-label={`Remove ingredient ${index + 1}`}
                disabled={form.ingredients.length === 1}
                onClick={() =>
                  set({
                    ingredients: form.ingredients.filter((_, i) => i !== index),
                  })
                }
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="link mt-3 text-sm"
          disabled={form.ingredients.length >= 60}
          onClick={() =>
            set({
              ingredients: [...form.ingredients, { name: "", measure: "" }],
            })
          }
        >
          Add an ingredient
        </button>
      </fieldset>

      <Field id="steps" label="Method" hint="One step per line">
        <textarea
          id="steps"
          value={form.steps}
          rows={8}
          onChange={e => set({ steps: e.target.value })}
          aria-describedby="steps-count"
          className="input"
        />
        {/* Long steps wrap, so the count shows where one step ends and the next begins. */}
        <p id="steps-count" className="mt-1.5 text-sm text-muted">
          {stepCount} {stepCount === 1 ? "step" : "steps"}
        </p>
      </Field>

      <Field
        id="photo"
        label="Photo"
        hint="JPEG, PNG or WebP, up to 5 MB. Only you and moderators see it until it's published."
      >
        {photoUrl && (
          <img
            src={photoUrl}
            alt="Your recipe photo"
            className="mb-3 w-48 rounded-xl object-cover"
          />
        )}
        <input
          id="photo"
          type="file"
          accept={PHOTO_TYPES.join(",")}
          disabled={busy}
          onChange={e => upload(e.target.files[0])}
          className="text-sm text-muted file:mr-4 file:min-h-[2.75rem] file:cursor-pointer file:rounded-full file:border file:border-solid file:border-line file:bg-surface file:px-5 file:font-semibold file:text-ink hover:file:border-herb"
        />
      </Field>

      <div aria-live="polite">
        {state.status === "error" && (
          <p role="alert" className="font-semibold text-danger">
            {state.message}
          </p>
        )}
        {state.status !== "error" && state.message && (
          <p className="text-muted">{state.message}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-line pt-6">
        <button
          type="button"
          className="btn-primary"
          disabled={busy}
          onClick={submit}
        >
          Send for review
        </button>
        <button type="submit" className="btn-quiet" disabled={busy}>
          {busy ? "Saving…" : "Save draft"}
        </button>
        <button
          type="button"
          className="link ml-auto text-sm"
          disabled={busy}
          onClick={remove}
        >
          Delete
        </button>
      </div>
    </form>
  )
}

const EditPage = ({ data }) => (
  <Layout>
    <section className="page max-w-3xl py-12">
      <Link to="/contribute/" className="link text-sm">
        Your recipes
      </Link>
      <h1 className="mt-2 text-display-md">Your recipe</h1>
      <div className="mt-8">
        <SignedIn>
          {session => (
            <Editor
              session={session}
              categories={data.allCategory.nodes.map(c => c.name)}
              cuisines={data.allCuisine.nodes.map(c => c.name)}
            />
          )}
        </SignedIn>
      </div>
    </section>
  </Layout>
)

export const Head = () => <Seo title="Your recipe" />

export default EditPage

export const query = graphql`
  query ContributeEdit {
    allCategory(sort: { name: ASC }) {
      nodes {
        name
      }
    }
    allCuisine(sort: { name: ASC }) {
      nodes {
        name
      }
    }
  }
`
