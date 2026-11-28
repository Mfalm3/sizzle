import React, { useEffect, useId, useRef, useState } from "react"
import { Link } from "gatsby"
import { AnimatePresence, motion } from "motion/react"
import Icon from "./Icon"
import { ease } from "../lib/motion"

// Shown only once sign-ups are switched on for the build (GATSBY_NEWSLETTER_ENABLED=true, set
// alongside the provider's API key), so the site never shows a form that can't work.
export const NEWSLETTER_ENABLED =
  process.env.GATSBY_NEWSLETTER_ENABLED === "true"

const ENDPOINT = "/api/newsletter/subscribe"

// Email sign-up for the home page ("section") and footer ("compact"). The server validates
// everything again and handles double opt-in through the newsletter provider.
const NewsletterSignup = ({ variant = "section" }) => {
  const id = useId()
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState({ status: "idle" })
  const startedAt = useRef(null)
  const honeypot = useRef(null)

  // When the form appeared: real people take a few seconds, scripts submit instantly.
  useEffect(() => {
    startedAt.current = Date.now()
  }, [])

  if (!NEWSLETTER_ENABLED) return null

  const compact = variant === "compact"
  const submitting = state.status === "submitting"

  const submit = async event => {
    event.preventDefault()
    if (!consent)
      return setState({
        status: "error",
        field: "consent",
        message: "Tick the box to agree to receive the newsletter",
      })
    setState({ status: "submitting" })
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          consent,
          website: honeypot.current?.value || "",
          startedAt: startedAt.current,
        }),
      })
      const result = await response.json().catch(() => ({
        ok: false,
        message:
          "Sign-ups aren't working right now. Please try again in a few minutes.",
      }))
      setState(
        result.ok
          ? { status: "success", message: result.message }
          : { status: "error", field: result.field, message: result.message }
      )
    } catch {
      setState({
        status: "error",
        message:
          "We couldn't reach the server. Check your connection and try again.",
      })
    }
  }

  const errorId = `${id}-error`
  const form = (
    <form
      onSubmit={submit}
      noValidate
      className={compact ? "space-y-3" : "space-y-4"}
    >
      <div
        className={
          compact
            ? "flex flex-col gap-2 sm:flex-row"
            : "flex flex-col gap-3 sm:flex-row"
        }
      >
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="you@example.com"
          aria-invalid={state.field === "email" || undefined}
          aria-describedby={state.status === "error" ? errorId : undefined}
          disabled={submitting}
          className={`input ${compact ? "border-surface/20 bg-surface/10 text-surface placeholder:text-surface/60" : ""}`}
        />
        <button
          type="submit"
          disabled={submitting}
          className={`btn-primary shrink-0 ${compact ? "bg-saffron text-ink hover:bg-saffron-soft" : ""}`}
        >
          {submitting ? "Subscribing…" : "Subscribe"}
        </button>
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill every field. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label>
          Website
          <input
            ref={honeypot}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
          />
        </label>
      </div>

      <label
        className={`flex cursor-pointer items-start gap-3 text-sm ${compact ? "text-surface/80" : "text-ink/80"}`}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={event => setConsent(event.target.checked)}
          disabled={submitting}
          aria-invalid={state.field === "consent" || undefined}
          className="mt-0.5 h-5 w-5 shrink-0 rounded accent-herb"
        />
        <span>
          Send me the Sizzle newsletter. I can unsubscribe any time. See the{" "}
          <Link to="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>
          .
        </span>
      </label>

      {state.status === "error" && (
        <p
          id={errorId}
          role="alert"
          className={`flex items-start gap-2 text-sm font-semibold ${compact ? "text-saffron-soft" : "text-danger"}`}
        >
          {state.message}
        </p>
      )}
    </form>
  )

  const success = (
    <motion.div
      key="success"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      role="status"
      className="flex items-start gap-3"
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${compact ? "bg-surface/15" : "bg-herb-soft text-herb"}`}
      >
        <Icon name="check" className="h-5 w-5" />
      </span>
      <p className={compact ? "text-surface/90" : ""}>{state.message}</p>
    </motion.div>
  )

  const body = (
    <AnimatePresence mode="wait">
      {state.status === "success" ? (
        success
      ) : (
        <motion.div key="form">{form}</motion.div>
      )}
    </AnimatePresence>
  )

  if (compact) {
    return (
      <div className="relative">
        <h2 className="font-sans text-sm font-semibold text-surface">
          Newsletter
        </h2>
        <p className="mb-3 mt-1 text-sm">
          Recipes, cooking tips and fresh ideas in your inbox.
        </p>
        {body}
      </div>
    )
  }

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-title"
      className="page"
    >
      <div className="relative grid items-center gap-8 rounded-2xl bg-saffron-soft px-6 py-10 sm:px-12 md:grid-cols-2">
        <div>
          <h2 id="newsletter-title" className="text-display-md">
            Get inspired in the kitchen
          </h2>
          <p className="mt-2 text-ink/80">
            Discover delicious recipes, cooking tips and fresh inspiration
            delivered to your inbox.
          </p>
        </div>
        {body}
      </div>
    </section>
  )
}

export default NewsletterSignup
