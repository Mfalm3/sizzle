// Reads ingredients from a photo of food, or from a photo of a shopping list, with Claude.
// Server-side only: the API key stays in the function. Images are checked (type, size, real image
// bytes) before anything is sent, identical images are answered from a cache instead of being
// processed again, and each visitor gets a small number of scans per hour to cap cost.
import { createHash } from "node:crypto"

export const MODES = {
  photo: {
    prompt:
      'List the food ingredients you can see in this photo, such as the contents of a fridge, a cupboard or a kitchen counter. Name each one the way a recipe would (for example "cheddar cheese", "red onion", "chicken breast"), in lower case, without brands, packaging or quantities. Leave out anything that isn\'t food. If you can\'t tell what something is, leave it out rather than guess.',
  },
  list: {
    prompt:
      "This is a photo of a shopping list or ingredient list, printed or handwritten. Read each food item on it and name it the way a recipe would, in lower case, without quantities, units, brands or prices. Skip crossed-out items and anything that isn't food. If a word is hard to read, give your best reading and mark it low confidence.",
  },
}

const MEDIA_TYPES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // "RIFF", checked with "WEBP" below
}
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // under Netlify's 6 MB request limit once base64-encoded
const MAX_ITEMS = 40
const RATE_LIMIT = { scans: 10, windowMs: 60 * 60 * 1000 }
const CACHE_SIZE = 200

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "confidence"],
        properties: {
          name: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
  },
}

const fail = (status, message, field) => ({
  status,
  json: { ok: false, message, ...(field && { field }) },
})

/** Checks the request before any cost is incurred. Returns { ok, mode, mediaType, data, bytes } or an error. */
export const validateScan = body => {
  const { mode, mediaType, image } = body || {}
  if (!MODES[mode])
    return { error: "Choose a photo of food or a shopping list", field: "mode" }
  if (!MEDIA_TYPES[mediaType] || typeof image !== "string" || !image)
    return { error: "Use a JPEG, PNG or WebP photo", field: "image" }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image))
    return {
      error: "That photo couldn't be read. Try another one.",
      field: "image",
    }
  const bytes = Buffer.from(image, "base64")
  if (bytes.length > MAX_IMAGE_BYTES)
    return {
      error: "That photo is too large. Try a smaller one.",
      field: "image",
    }
  // The bytes must really be the declared image type, not something else with an image label.
  const magic = MEDIA_TYPES[mediaType]
  const isType =
    magic.every((b, i) => bytes[i] === b) &&
    (mediaType !== "image/webp" || bytes.toString("latin1", 8, 12) === "WEBP")
  if (!isType)
    return {
      error: "That file isn't a photo we can read. Try a JPEG or PNG.",
      field: "image",
    }
  return { ok: true, mode, mediaType, data: image, bytes }
}

// Trim, lower-case, drop duplicates and empties, and keep the list a sensible length.
export const cleanItems = items => {
  const seen = new Set()
  const out = []
  for (const item of Array.isArray(items) ? items : []) {
    const name = String(item?.name || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60)
    if (!name || seen.has(name)) continue
    seen.add(name)
    const confidence = ["high", "medium", "low"].includes(item.confidence)
      ? item.confidence
      : "low"
    out.push({ name, confidence })
    if (out.length === MAX_ITEMS) break
  }
  return out
}

/** Asks Claude for the ingredients. `messages` is the Anthropic client's `beta.messages`. */
export const readIngredients = async ({ messages, mode, mediaType, data }) => {
  const response = await messages.create({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    // Reading a photo is a short, simple job, so keep thinking (always on for this model) light.
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: SCHEMA },
    },
    // If the model declines, Anthropic re-runs the request on its recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data },
          },
          { type: "text", text: MODES[mode].prompt },
        ],
      },
    ],
  })
  if (response.stop_reason === "refusal") return { status: "refused" }
  if (response.stop_reason === "max_tokens") return { status: "failed" }
  const text = response.content.find(block => block.type === "text")?.text
  try {
    return { status: "ok", items: cleanItems(JSON.parse(text).items) }
  } catch {
    return { status: "failed" }
  }
}

const cache = new Map()
const hits = new Map()

const remember = (key, value) => {
  cache.delete(key)
  cache.set(key, value)
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value)
}

// shortcut: in-memory, so each warm function instance keeps its own cache and counts; move both
// to a shared store (e.g. Netlify Blobs) if traffic grows enough for that to matter.
const allow = (ip, now) => {
  if (!ip) return true
  const recent = (hits.get(ip) || []).filter(t => now - t < RATE_LIMIT.windowMs)
  if (recent.length >= RATE_LIMIT.scans) return false
  recent.push(now)
  hits.set(ip, recent)
  return true
}

export const resetScanState = () => {
  cache.clear()
  hits.clear()
}

/**
 * The whole request: validate, answer from cache, rate-limit, call Claude, shape the reply.
 * `createMessages(apiKey)` returns the client's `beta.messages`, injected so tests need no network.
 */
export const handleScan = async ({
  body,
  ip,
  now,
  env,
  createMessages,
  log = console,
}) => {
  if (!env.ANTHROPIC_API_KEY)
    return fail(503, "Photo scanning isn't available yet")
  const input = validateScan(body)
  if (input.error) return fail(400, input.error, input.field)

  const key = createHash("sha256")
    .update(input.mode)
    .update(input.bytes)
    .digest("hex")
  if (cache.has(key))
    return {
      status: 200,
      json: { ok: true, items: cache.get(key), cached: true },
    }

  if (!allow(ip, now))
    return fail(
      429,
      "You've scanned a lot of photos. Try again in an hour, or type the ingredients."
    )

  let result
  try {
    result = await readIngredients({
      messages: createMessages(env.ANTHROPIC_API_KEY),
      ...input,
    })
  } catch (error) {
    log.error(
      "Pantry scan failed:",
      error?.status || "",
      error?.message || error
    )
    return fail(
      502,
      "We couldn't read that photo right now. Try again in a minute."
    )
  }
  if (result.status === "refused")
    return fail(
      422,
      "We can't read ingredients from that photo. Try a different one."
    )
  if (result.status !== "ok")
    return fail(
      502,
      "We couldn't read that photo right now. Try again in a minute."
    )

  remember(key, result.items)
  return { status: 200, json: { ok: true, items: result.items } }
}
