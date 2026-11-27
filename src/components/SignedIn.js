import React from "react"
import { Link } from "gatsby"
import { CONTRIBUTIONS_ENABLED, useSession } from "../lib/supabase"

// Renders `children(session)` for a signed-in visitor, a sign-in prompt otherwise. Pages using it
// are static shells: everything private is fetched in the browser, under the visitor's session.
const SignedIn = ({ children }) => {
  const session = useSession()
  if (!CONTRIBUTIONS_ENABLED)
    return <p className="text-muted">Recipe submissions aren't open yet.</p>
  if (session === undefined)
    return (
      <p className="text-muted" role="status">
        Loading…
      </p>
    )
  if (!session)
    return (
      <div>
        <p className="text-muted">Sign in to share and manage your recipes.</p>
        <Link to="/login/" className="btn-primary mt-4">
          Sign in
        </Link>
      </div>
    )
  return children(session)
}

export default SignedIn
