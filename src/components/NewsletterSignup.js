import React from "react"
import { graphql, useStaticQuery } from "gatsby"

// Posts straight to the mailing-list provider set in siteMetadata.newsletterAction.
// With no provider configured the section is hidden rather than shown as a form that goes nowhere.
const NewsletterSignup = () => {
  const { site } = useStaticQuery(graphql`
    query NewsletterQuery {
      site {
        siteMetadata {
          newsletterAction
        }
      }
    }
  `)
  const action = site.siteMetadata.newsletterAction
  if (!action) return null

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-title"
      className="page"
    >
      <div className="grid items-center gap-8 rounded-2xl bg-saffron-soft px-6 py-10 sm:px-12 md:grid-cols-2">
        <div>
          <h2 id="newsletter-title" className="text-display-md">
            One good recipe, every Sunday
          </h2>
          <p className="mt-2 text-ink/80">
            A single dish worth planning your week around. Unsubscribe whenever
            you like.
          </p>
        </div>
        <form
          action={action}
          method="post"
          target="_blank"
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input"
          />
          <button type="submit" className="btn-primary shrink-0">
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}

export default NewsletterSignup
