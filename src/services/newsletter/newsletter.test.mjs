import { test } from "node:test"
import assert from "node:assert/strict"
import { validateSubmission, handleSubscribe } from "./index.js"
import handler from "../../api/newsletter/subscribe.js"

const NOW = 1_800_000_000_000
const good = {
  email: " Cook@Example.COM ",
  consent: true,
  website: "",
  startedAt: NOW - 8000,
}
const env = { BUTTONDOWN_API_KEY: "test-key" }
const silent = { error: () => {} }

// A fake fetch that records the request and answers with the given status and body.
const fakeFetch = (status, body = "") => {
  const calls = []
  const fn = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) })
    return new Response(body, { status })
  }
  fn.calls = calls
  return fn
}

test("validates email, consent and bot signals on the server", () => {
  assert.deepEqual(validateSubmission(good, NOW), {
    ok: true,
    email: "cook@example.com",
  })
  for (const email of [
    "",
    "cook",
    "cook@",
    "cook@example",
    "co ok@example.com",
    "a@b.c",
    `${"x".repeat(250)}@ex.com`,
  ]) {
    assert.equal(
      validateSubmission({ ...good, email }, NOW).field,
      "email",
      email
    )
  }
  assert.equal(
    validateSubmission({ ...good, consent: false }, NOW).field,
    "consent"
  )
  assert.equal(
    validateSubmission({ ...good, consent: undefined }, NOW).field,
    "consent"
  )
  assert.deepEqual(
    validateSubmission({ ...good, website: "http://spam.example" }, NOW),
    { spam: true }
  )
  assert.deepEqual(validateSubmission({ ...good, startedAt: NOW - 300 }, NOW), {
    spam: true,
  })
})

test("subscribes through Buttondown with the visitor's IP and double opt-in left on", async () => {
  const fetch = fakeFetch(201, "{}")
  const result = await handleSubscribe({
    body: good,
    ip: "203.0.113.7",
    now: NOW,
    env,
    fetch,
    log: silent,
  })
  assert.equal(result.status, 200)
  assert.match(result.json.message, /check your inbox/i)
  const [call] = fetch.calls
  assert.equal(call.url, "https://api.buttondown.com/v1/subscribers")
  assert.equal(call.init.headers.Authorization, "Token test-key")
  assert.deepEqual(call.body, {
    email_address: "cook@example.com",
    ip_address: "203.0.113.7",
    tags: ["website"],
  })
  assert.equal(call.body.type, undefined) // "regular" would skip the confirmation email
})

test("answers duplicates exactly like new sign-ups, so the list can't be probed", async () => {
  const fresh = await handleSubscribe({
    body: good,
    now: NOW,
    env,
    fetch: fakeFetch(201),
    log: silent,
  })
  const dup = await handleSubscribe({
    body: good,
    now: NOW,
    env,
    fetch: fakeFetch(400, '{"detail":"That email address already exists."}'),
    log: silent,
  })
  assert.deepEqual(dup, fresh)
})

test("never contacts the provider for invalid input or spam", async () => {
  const fetch = fakeFetch(201)
  const invalid = await handleSubscribe({
    body: { ...good, email: "nope" },
    now: NOW,
    env,
    fetch,
    log: silent,
  })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.json.field, "email")
  const spam = await handleSubscribe({
    body: { ...good, website: "x" },
    now: NOW,
    env,
    fetch,
    log: silent,
  })
  assert.equal(spam.status, 200) // looks like success to the bot
  assert.equal(fetch.calls.length, 0)
})

test("reports provider rejections, rate limits and outages clearly", async () => {
  const run = (status, body) =>
    handleSubscribe({
      body: good,
      now: NOW,
      env,
      fetch: fakeFetch(status, body),
      log: silent,
    })
  assert.equal(
    (await run(400, '{"detail":"Invalid email"}')).json.field,
    "email"
  )
  assert.equal((await run(403, "blocked")).status, 400)
  assert.equal((await run(401, "bad key")).status, 502)
  assert.equal((await run(429)).status, 429)
  assert.equal((await run(503)).status, 502)
  const offline = await handleSubscribe({
    body: good,
    now: NOW,
    env,
    fetch: async () => {
      throw new Error("ECONNRESET")
    },
    log: silent,
  })
  assert.equal(offline.status, 502)
})

test("refuses politely when no provider is configured", async () => {
  const result = await handleSubscribe({
    body: good,
    now: NOW,
    env: {},
    fetch: fakeFetch(201),
    log: silent,
  })
  assert.equal(result.status, 503)
  assert.match(result.json.message, /aren't open yet/)
})

test("the endpoint only accepts POST and reads Netlify's client IP header", async () => {
  const res = () => {
    const r = { headers: {}, code: 0, body: null }
    r.setHeader = (k, v) => (r.headers[k] = v)
    r.status = c => ((r.code = c), r)
    r.json = b => ((r.body = b), r)
    return r
  }
  const get = await handler({ method: "GET", headers: {} }, res())
  assert.equal(get.code, 405)
  assert.equal(get.headers.Allow, "POST")
  assert.equal(get.headers["Cache-Control"], "no-store")
})
