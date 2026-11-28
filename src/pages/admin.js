import React from "react"
import { Link, graphql } from "gatsby"

import Seo from "../components/seo"
import { Logo } from "../components/header"
import { CONTRIBUTIONS_ENABLED } from "../lib/supabase"

const pct = (n, total) => `${Math.round((n / total) * 100)}%`

// Read-only content health view. Community recipes are moderated at /admin/moderation.
const AdminPage = ({ data }) => {
  const recipes = data.allRecipe.nodes
  const total = recipes.length
  const categories = [...data.categories.group].sort(
    (a, b) => b.totalCount - a.totalCount
  )
  const maxCategory = categories[0].totalCount
  const gaps = [
    { label: "No cuisine", items: recipes.filter(r => !r.cuisine) },
    {
      label: "Method in one block",
      items: recipes.filter(r => r.stepCount < 2),
    },
    { label: "No source link", items: recipes.filter(r => !r.source) },
    { label: "No video", items: recipes.filter(r => !r.youtube) },
    { label: "No tags", items: recipes.filter(r => !r.tags.length) },
  ]
  const stats = [
    { label: "Recipes", value: total },
    { label: "Categories", value: categories.length },
    { label: "Cuisines", value: data.cuisines.distinct.length },
    { label: "With video", value: pct(total - gaps[3].items.length, total) },
  ]

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-ink text-surface">
        <div className="page flex h-14 items-center justify-between">
          <div className="flex items-center gap-3 [&_a]:text-xl">
            <Logo siteTitle="Sizzle" />
            <span className="rounded-full bg-surface/10 px-2.5 py-0.5 text-xs font-semibold">
              Admin
            </span>
          </div>
          <nav className="flex items-center gap-5 text-sm">
            {CONTRIBUTIONS_ENABLED && (
              <Link
                to="/admin/moderation/"
                className="text-surface/80 hover:text-surface"
              >
                Moderation
              </Link>
            )}
            <Link to="/" className="text-surface/80 hover:text-surface">
              View site
            </Link>
          </nav>
        </div>
      </header>

      <main id="main" className="page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-sans text-2xl font-semibold">
              Content overview
            </h1>
            <p className="mt-1 text-sm text-muted">
              Built from the recipe data at the last site build
            </p>
          </div>
          <p className="rounded-lg border border-saffron bg-saffron-soft px-3 py-2 text-sm">
            Read-only.{" "}
            {CONTRIBUTIONS_ENABLED ? (
              <>
                Community recipes are reviewed in{" "}
                <Link to="/admin/moderation/" className="link font-normal">
                  Moderation
                </Link>
                .
              </>
            ) : (
              "Community recipes appear once Supabase is set up."
            )}
          </p>
        </div>

        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="bg-surface p-5">
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="mt-1 text-3xl font-medium tabular-nums">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <section
            aria-labelledby="by-category"
            className="rounded-xl border border-line p-6"
          >
            <h2 id="by-category" className="font-sans text-base font-semibold">
              Recipes per category
            </h2>
            <ul className="mt-4 space-y-2.5">
              {/* One accent per chart: the leading category in herb green, the rest in a neutral step */}
              {categories.map((c, i) => (
                <li
                  key={c.fieldValue}
                  className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm"
                >
                  <Link
                    to={`/recipes?category=${encodeURIComponent(c.fieldValue)}`}
                    className="truncate hover:text-herb"
                  >
                    {c.fieldValue}
                  </Link>
                  <span className="h-2.5 rounded-full bg-paper">
                    <span
                      className={`block h-full rounded-full ${
                        i === 0 ? "bg-herb" : "bg-muted/40"
                      }`}
                      style={{
                        width: `${(c.totalCount / maxCategory) * 100}%`,
                      }}
                    />
                  </span>
                  <span className="text-right tabular-nums text-muted">
                    {c.totalCount}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="gaps"
            className="rounded-xl border border-line p-6"
          >
            <h2 id="gaps" className="font-sans text-base font-semibold">
              Data gaps
            </h2>
            <p className="mt-1 text-sm text-muted">
              Recipes that would benefit from editing once the editor exists
            </p>
            <table className="mt-4 w-full text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b border-line">
                  <th className="py-2 font-medium">Issue</th>
                  <th className="py-2 text-right font-medium">Recipes</th>
                  <th className="py-2 text-right font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {gaps.map(g => (
                  <tr
                    key={g.label}
                    className="border-b border-line last:border-0"
                  >
                    <td className="py-2.5">{g.label}</td>
                    <td className="py-2.5 text-right tabular-nums">
                      {g.items.length}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted">
                      {pct(g.items.length, total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="mt-6 font-sans text-sm font-semibold">
              Methods written as one block
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              {gaps[1].items.slice(0, 8).map(r => (
                <li key={r.slug}>
                  <Link
                    to={`/recipes/${r.slug}`}
                    className="text-herb hover:underline"
                  >
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section
          aria-labelledby="recent"
          className="mt-10 overflow-x-auto rounded-xl border border-line"
        >
          <h2
            id="recent"
            className="px-6 pt-6 font-sans text-base font-semibold"
          >
            Recently updated
          </h2>
          <table className="mt-4 w-full min-w-[36rem] text-sm">
            <thead className="bg-paper text-left text-muted">
              <tr>
                <th className="px-6 py-2.5 font-medium">Recipe</th>
                <th className="px-6 py-2.5 font-medium">Category</th>
                <th className="px-6 py-2.5 font-medium">Cuisine</th>
                <th className="px-6 py-2.5 text-right font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.latest.nodes.map(r => (
                <tr key={r.slug} className="border-t border-line">
                  <td className="px-6 py-2.5">
                    <Link
                      to={`/recipes/${r.slug}`}
                      className="font-medium hover:text-herb"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-6 py-2.5 text-muted">{r.category}</td>
                  <td className="px-6 py-2.5 text-muted">
                    {r.cuisine || "None"}
                  </td>
                  <td className="px-6 py-2.5 text-right tabular-nums text-muted">
                    {r.updatedAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}

export const Head = () => <Seo title="Admin" noindex />

export default AdminPage

export const query = graphql`
  query AdminPage {
    allRecipe {
      nodes {
        name
        slug
        cuisine
        stepCount
        source
        youtube
        tags
      }
    }
    categories: allRecipe {
      group(field: { category: SELECT }) {
        fieldValue
        totalCount
      }
    }
    cuisines: allRecipe(filter: { cuisine: { ne: null } }) {
      distinct(field: { cuisine: SELECT })
    }
    latest: allRecipe(
      filter: { updatedAt: { ne: null } }
      sort: { updatedAt: DESC }
      limit: 12
    ) {
      nodes {
        name
        slug
        category
        cuisine
        updatedAt(formatString: "D MMM YYYY")
      }
    }
  }
`
