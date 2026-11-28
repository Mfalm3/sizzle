import { test, beforeEach } from "node:test"
import assert from "node:assert/strict"
import {
  cleanItems,
  handleScan,
  resetScanState,
  validateScan,
  MAX_IMAGE_BYTES,
} from "./index.js"

const jpeg = (extra = "photo") =>
  Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.from(extra),
  ]).toString("base64")
const body = (overrides = {}) => ({
  mode: "photo",
  mediaType: "image/jpeg",
  image: jpeg(),
  ...overrides,
})
const env = { ANTHROPIC_API_KEY: "test-key" }
const silent = { error: () => {} }

// A fake `beta.messages` that records each request and answers with the given response.
const fakeClient = response => {
  const calls = []
  const createMessages = () => ({
    create: async params => {
      calls.push(params)
      if (response instanceof Error) throw response
      return response
    },
  })
  createMessages.calls = calls
  return createMessages
}
const answer = (items, dish = "") => ({
  stop_reason: "end_turn",
  content: [
    { type: "thinking", thinking: "" },
    { type: "text", text: JSON.stringify({ items, dish }) },
  ],
})
const scan = (createMessages, overrides = {}, ip = "203.0.113.7") =>
  handleScan({
    body: body(overrides),
    ip,
    now: 1_800_000_000_000,
    env,
    createMessages,
    log: silent,
  })

beforeEach(resetScanState)

test("checks the photo before anything is sent", () => {
  assert.equal(validateScan(body()).ok, true)
  assert.equal(validateScan(body({ mode: "video" })).field, "mode")
  assert.equal(validateScan(body({ mediaType: "image/heic" })).field, "image")
  assert.equal(validateScan(body({ image: "" })).field, "image")
  assert.equal(validateScan(body({ image: "not base64!" })).field, "image")
  // Labelled as a JPEG but actually a PNG, or text.
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2]).toString("base64")
  assert.equal(validateScan(body({ image: png })).field, "image")
  assert.equal(
    validateScan(body({ image: png, mediaType: "image/png" })).ok,
    true
  )
  assert.equal(
    validateScan(body({ image: Buffer.from("<svg>").toString("base64") }))
      .field,
    "image"
  )
  const riffNotWebp = Buffer.from("RIFF0000WAVE").toString("base64")
  assert.equal(
    validateScan(body({ image: riffNotWebp, mediaType: "image/webp" })).field,
    "image"
  )
  const big = jpeg("x".repeat(MAX_IMAGE_BYTES))
  assert.match(validateScan(body({ image: big })).error, /too large/)
})

test("sends the image with the mode's prompt and returns cleaned ingredients", async () => {
  const client = fakeClient(
    answer([
      { name: " Red Onion ", confidence: "high" },
      { name: "red onion", confidence: "low" },
      { name: "", confidence: "high" },
      { name: "eggs", confidence: "medium" },
    ])
  )
  const result = await scan(client, { mode: "list" })
  assert.equal(result.status, 200)
  assert.deepEqual(result.json.items, [
    { name: "red onion", confidence: "high" },
    { name: "eggs", confidence: "medium" },
  ])
  const [params] = client.calls
  assert.equal(params.model, "claude-opus-5-5")
  assert.equal(params.output_config.format.type, "json_schema")
  assert.deepEqual(params.fallbacks, "default")
  const [image, prompt] = params.messages[0].content
  assert.equal(image.source.media_type, "image/jpeg")
  assert.equal(image.source.data, body().image)
  assert.match(prompt.text, /shopping list/)
})

test("answers the same photo from the cache instead of processing it again", async () => {
  const client = fakeClient(answer([{ name: "eggs", confidence: "high" }]))
  await scan(client)
  const again = await scan(client)
  assert.equal(again.json.cached, true)
  assert.equal(client.calls.length, 1)
  // The same photo read as a list is a different job.
  await scan(client, { mode: "list" })
  assert.equal(client.calls.length, 2)
})

test("never calls Claude for invalid input or without a key", async () => {
  const client = fakeClient(answer([]))
  assert.equal((await scan(client, { mediaType: "image/gif" })).status, 400)
  const off = await handleScan({
    body: body(),
    env: {},
    createMessages: client,
    log: silent,
  })
  assert.equal(off.status, 503)
  assert.equal(client.calls.length, 0)
})

test("limits how many photos one visitor can scan", async () => {
  const client = fakeClient(answer([]))
  for (let i = 0; i < 10; i++)
    assert.equal((await scan(client, { image: jpeg(`p${i}`) })).status, 200)
  assert.equal((await scan(client, { image: jpeg("one more") })).status, 429)
  assert.equal(
    (await scan(client, { image: jpeg("one more") }, "198.51.100.1")).status,
    200
  )
})

test("reports refusals, truncated or broken replies, and outages", async () => {
  assert.equal(
    (await scan(fakeClient({ stop_reason: "refusal", content: [] }))).status,
    422
  )
  assert.equal(
    (
      await scan(fakeClient({ stop_reason: "max_tokens", content: [] }), {
        image: jpeg("a"),
      })
    ).status,
    502
  )
  assert.equal(
    (
      await scan(
        fakeClient({
          stop_reason: "end_turn",
          content: [{ type: "text", text: "{" }],
        }),
        {
          image: jpeg("b"),
        }
      )
    ).status,
    502
  )
  assert.equal(
    (await scan(fakeClient(new Error("ECONNRESET")), { image: jpeg("c") }))
      .status,
    502
  )
})

test("caps and tidies the list", () => {
  const many = Array.from({ length: 60 }, (_, i) => ({
    name: `item ${i}`,
    confidence: "high",
  }))
  assert.equal(cleanItems(many).length, 40)
  assert.deepEqual(cleanItems([{ name: "Salt", confidence: "sure" }]), [
    { name: "salt", confidence: "low" },
  ])
  assert.deepEqual(cleanItems(null), [])
})

test("names a cooked dish instead of guessing its ingredients, and caches that too", async () => {
  const client = fakeClient(answer([], " Shakshuka "))
  const first = await scan(client)
  assert.deepEqual(first.json, { ok: true, items: [], dish: "Shakshuka" })
  const again = await scan(client)
  assert.equal(again.json.dish, "Shakshuka")
  assert.equal(client.calls.length, 1)
  // Older or partial replies without the field still work.
  const plain = await scan(
    fakeClient({
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: '{"items":[{"name":"egg","confidence":"high"}]}',
        },
      ],
    }),
    { image: jpeg("plain") }
  )
  assert.equal(plain.json.dish, "")
})
