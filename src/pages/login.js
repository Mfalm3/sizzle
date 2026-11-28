import React, { useState } from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import { CONTRIBUTIONS_ENABLED, getSupabase, useSession } from "../lib/supabase"

// Sign-in by emailed link: no passwords to store or reset. The same page signs people up.
const LoginPage = () => {
  const session = useSession()
  const [email, setEmail] = useState("")
  const [state, setState] = useState({ status: "idle" })

  const submit = async event => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setState({ status: "error", message: "Enter your email address" })
    setState({ status: "sending" })
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/contribute/` },
    })
    setState(
      error
        ? {
            status: "error",
            message:
              error.status === 429
                ? "Too many sign-in emails. Wait a few minutes and try again."
                : "We couldn't send the email. Try again in a minute.",
          }
        : { status: "sent" }
    )
  }

  return (
    <Layout>
      <section className="page max-w-md py-16">
        <h1 className="text-display-md">Share your recipes</h1>
        {!CONTRIBUTIONS_ENABLED ? (
          <p className="mt-3 text-muted">Recipe submissions aren't open yet.</p>
        ) : session ? (
          <>
            <p className="mt-3 text-muted">You're signed in.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/contribute/" className="btn-primary">
                Your recipes
              </Link>
              <button
                type="button"
                className="btn-quiet"
                onClick={() => getSupabase().auth.signOut()}
              >
                Sign out
              </button>
            </div>
          </>
        ) : state.status === "sent" ? (
          <div role="status" className="mt-6 rounded-xl bg-herb-soft p-5">
            <p className="font-semibold">Check your inbox</p>
            <p className="mt-1">
              We sent a sign-in link to {email.trim()}. Open it in this browser
              to continue. It works once and expires in an hour.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-3 text-muted">
              Sign in or create an account with your email. We'll send you a
              link, no password needed. Recipes are checked by a moderator
              before they appear on Sizzle.
            </p>
            <form onSubmit={submit} noValidate className="mt-6 space-y-3">
              <label htmlFor="login-email" className="text-sm font-semibold">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                aria-invalid={state.status === "error" || undefined}
                aria-describedby={
                  state.status === "error" ? "login-error" : undefined
                }
                disabled={state.status === "sending"}
                className="input"
              />
              {state.status === "error" && (
                <p
                  id="login-error"
                  role="alert"
                  className="text-sm font-semibold text-danger"
                >
                  {state.message}
                </p>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={state.status === "sending"}
              >
                {state.status === "sending" ? "Sending…" : "Email me a link"}
              </button>
            </form>
            <p className="mt-6 text-sm text-muted">
              Your email address is only used to sign you in. It's never shown
              on the site.
            </p>
          </>
        )}
      </section>
    </Layout>
  )
}

export const Head = () => <Seo title="Sign in" />

export default LoginPage
