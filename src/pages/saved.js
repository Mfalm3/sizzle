import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SplitText from "../components/motion/SplitText"
import { reveal } from "../lib/reveal"
import RecipeCard from "../components/RecipeCard"
import RecentlyViewed from "../components/RecentlyViewed"
import EmptyPlate from "../components/EmptyPlate"
import { SAVED, clearList, useStoredList } from "../lib/storage"

const SavedPage = () => {
  const saved = useStoredList(SAVED)

  return (
    <Layout>
      <header className="page pb-10 pt-8 lg:pt-12">
        <SplitText as="h1" text="Saved recipes" className="text-display-lg" />
        <p className="mt-3 max-w-prose text-lg text-muted">
          Saved on this device only, so they won't follow you to another browser
          yet
        </p>
      </header>

      <section aria-label="Saved recipes" className="page">
        {saved.length === 0 ? (
          <div
            ref={reveal}
            data-reveal="up"
            className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center"
          >
            <EmptyPlate className="w-56" />
            <h2 className="mt-6 text-display-sm">Nothing saved yet</h2>
            <p className="mt-2 max-w-sm text-muted">
              Tap the heart on any recipe to keep it here for later
            </p>
            <Link to="/recipes" className="btn-primary mt-6">
              Find a recipe
            </Link>
          </div>
        ) : (
          <>
            <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {saved.map((recipe, i) => (
                <li key={recipe.recipeId}>
                  <RecipeCard recipe={recipe} headingLevel="h2" index={i % 4} />
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                window.confirm(`Remove all ${saved.length} saved recipes?`) &&
                clearList(SAVED)
              }
              className="mt-10 text-sm text-muted underline underline-offset-4 hover:text-ink"
            >
              Remove all saved recipes
            </button>
          </>
        )}
      </section>

      <div className="mt-24">
        <RecentlyViewed title="Recently viewed" limit={12} />
      </div>
    </Layout>
  )
}

export const Head = () => <Seo title="Saved recipes" noindex />

export default SavedPage
