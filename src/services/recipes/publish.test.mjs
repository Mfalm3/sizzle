import { test } from "node:test"
import assert from "node:assert/strict"
import { handlePublish } from "./publish.js"

const ID = "6f1c2a4e-8b3d-4c5e-9f60-718293a4b5c6"
const AUTHOR = "a1a1a1a1-0000-0000-0000-000000000000"

// Fake Supabase and Netlify, recording what was done.
const setup = ({
  role = "moderator",
  recipe = {
    status: "approved",
    image_path: `${AUTHOR}/p.jpg`,
    author_id: AUTHOR,
  },
  statusOk = true,
  canCopyImages = true,
  rebuild = true,
  copyFails = false,
} = {}) => {
  const done = []
  const deps = {
    canCopyImages,
    getUser: async token => (token === "good" ? { id: "mod" } : null),
    getRole: async () => role,
    getRecipe: async () => recipe,
    setStatus: async (_t, _id, status) => {
      done.push(`status:${status}`)
      return statusOk ? { ok: true } : { ok: false, message: "not allowed" }
    },
    copyImage: async path => {
      if (copyFails) throw new Error("storage down")
      done.push(`copy:${path}`)
    },
    removeImage: async path => done.push(`remove:${path}`),
    rebuild: async () => (done.push("rebuild"), rebuild),
  }
  return { deps, done }
}
const run = (
  deps,
  body = { recipeId: ID, action: "publish" },
  token = "good"
) => handlePublish({ token, body, deps, log: { error: () => {} } })

test("publishes an approved recipe: photo first, then status, then rebuild", async () => {
  const { deps, done } = setup()
  const result = await run(deps)
  assert.equal(result.status, 200)
  assert.deepEqual(done, [
    `copy:${AUTHOR}/p.jpg`,
    "status:published",
    "rebuild",
  ])
})

test("unpublishing takes the photo back out of the public bucket", async () => {
  const { deps, done } = setup({
    recipe: {
      status: "published",
      image_path: `${AUTHOR}/p.jpg`,
      author_id: AUTHOR,
    },
  })
  const result = await run(deps, { recipeId: ID, action: "unpublish" })
  assert.equal(result.status, 200)
  assert.deepEqual(done, [
    "status:approved",
    `remove:${AUTHOR}/p.jpg`,
    "rebuild",
  ])
})

test("refuses anyone who isn't a signed-in moderator", async () => {
  assert.equal((await run(setup().deps, undefined, "")).status, 401)
  assert.equal((await run(setup().deps, undefined, "expired")).status, 401)
  const { deps, done } = setup({ role: "contributor" })
  assert.equal((await run(deps)).status, 403)
  assert.deepEqual(done, [])
})

test("rejects bad input and the wrong starting status", async () => {
  assert.equal(
    (await run(setup().deps, { recipeId: "1; drop", action: "publish" }))
      .status,
    400
  )
  assert.equal(
    (await run(setup().deps, { recipeId: ID, action: "delete" })).status,
    400
  )
  const { deps, done } = setup({
    recipe: { status: "submitted", author_id: AUTHOR },
  })
  assert.equal((await run(deps)).status, 409)
  assert.equal((await run(setup({ recipe: null }).deps)).status, 404)
  assert.deepEqual(done, [])
})

test("never makes a photo outside the author's folder public", async () => {
  const { deps, done } = setup({
    recipe: {
      status: "approved",
      image_path: "someone-else/p.jpg",
      author_id: AUTHOR,
    },
  })
  assert.equal((await run(deps)).status, 422)
  assert.deepEqual(done, [])
})

test("cleans up the copied photo when the database refuses the change", async () => {
  const { deps, done } = setup({ statusOk: false })
  assert.equal((await run(deps)).status, 409)
  assert.deepEqual(done, [
    `copy:${AUTHOR}/p.jpg`,
    "status:published",
    `remove:${AUTHOR}/p.jpg`,
  ])
})

test("reports a missing secret key, storage failures and a failed rebuild", async () => {
  assert.equal((await run(setup({ canCopyImages: false }).deps)).status, 503)
  // Without a photo, no secret key is needed.
  const noPhoto = setup({
    canCopyImages: false,
    recipe: { status: "approved", image_path: null, author_id: AUTHOR },
  })
  assert.equal((await run(noPhoto.deps)).status, 200)
  assert.equal((await run(setup({ copyFails: true }).deps)).status, 502)
  const unbuilt = await run(setup({ rebuild: false }).deps)
  assert.equal(unbuilt.status, 200)
  assert.match(unbuilt.json.message, /didn't rebuild/)
})
