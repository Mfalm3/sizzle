// Newsletter service: validates a sign-up and hands it to the configured provider. Runs only on
// the server (src/api/newsletter/subscribe.js), where the provider's API key lives.
// To switch providers, add an adapter with the same `subscribe` contract and register it below.
import { createButtondown } from "./buttondown.js"

const PROVIDERS = {
  buttondown: (env, fetch) =>
    env.BUTTONDOWN_API_KEY &&
    createButtondown({
      apiKey: env.BUTTONDOWN_API_KEY,
      apiVersion: env.BUTTONDOWN_API_VERSION,
      fetch,
    }),
}

export const getProvider = (env, fetch) => {
  const make = PROVIDERS[env.NEWSLETTER_PROVIDER || "buttondown"]
  return (make && make(env, fetch)) || null
}

// Long enough for any real address (RFC 5321 caps it at 254), strict enough to catch typos.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/
// People take a few seconds to type an address and tick a box; scripts don't.
const MIN_FILL_MS = 1500

/**
 * @param body  { email, consent, website (honeypot, must be empty), startedAt (ms when the form appeared) }
 * @returns { ok: true, email } | { ok: false, field, message } | { spam: true }
 */
export const validateSubmission = (body, now) => {
  if (typeof body?.website === "string" && body.website.trim())
    return { spam: true }
  const startedAt = Number(body?.startedAt)
  if (Number.isFinite(startedAt) && now - startedAt < MIN_FILL_MS)
    return { spam: true }

  const email = String(body?.email ?? "")
    .trim()
    .toLowerCase()
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    return {
      ok: false,
      field: "email",
      message: "Enter a valid email address, like name@example.com",
    }
  }
  if (![true, "true", "yes", "on"].includes(body?.consent)) {
    return {
      ok: false,
      field: "consent",
      message: "Tick the box to agree to receive the newsletter",
    }
  }
  return { ok: true, email }
}

const CHECK_INBOX =
  "Almost there. Check your inbox: if this address isn't subscribed yet, we've sent a link to confirm it. Your subscription starts once you click it."

/**
 * Turns a sign-up request into an HTTP status and a message for the form.
 * The same "check your inbox" reply covers new, already-subscribed and spam submissions, so the
 * form never reveals whether an address is on the list.
 */
export const handleSubscribe = async ({
  body,
  ip,
  now,
  env,
  fetch,
  log = console,
}) => {
  const checked = validateSubmission(body, now)
  if (checked.spam)
    return { status: 200, json: { ok: true, message: CHECK_INBOX } }
  if (!checked.ok)
    return {
      status: 400,
      json: { ok: false, field: checked.field, message: checked.message },
    }

  const provider = getProvider(env, fetch)
  if (!provider) {
    log.error("newsletter: no provider configured (set BUTTONDOWN_API_KEY)")
    return {
      status: 503,
      json: { ok: false, message: "Newsletter sign-ups aren't open yet" },
    }
  }

  const result = await provider.subscribe({
    email: checked.email,
    ipAddress: ip,
    tags: ["website"],
  })
  switch (result.status) {
    case "pending":
    case "exists":
      return { status: 200, json: { ok: true, message: CHECK_INBOX } }
    case "rate_limited":
      return {
        status: 429,
        json: {
          ok: false,
          message:
            "Lots of people are signing up right now. Please try again later.",
        },
      }
    case "rejected":
      // Never log the address itself.
      log.error(
        `newsletter: ${provider.name} rejected a sign-up: ${result.detail || "no detail"}`
      )
      return {
        status: 400,
        json: {
          ok: false,
          field: "email",
          message:
            "We couldn't subscribe that address. Check it's correct, or try another one.",
        },
      }
    default:
      log.error(`newsletter: ${provider.name} unavailable`)
      return {
        status: 502,
        json: {
          ok: false,
          message:
            "Sign-ups aren't working right now. Please try again in a few minutes.",
        },
      }
  }
}
