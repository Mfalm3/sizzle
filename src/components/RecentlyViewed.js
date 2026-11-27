import React from "react"
import RecipeCard from "./RecipeCard"
import SectionHeading from "./SectionHeading"
import { RECENT, clearList, useStoredList } from "../lib/storage"

// Recipes opened on this device. Renders nothing until there is history.
const RecentlyViewed = ({
  title = "Pick up where you left off",
  limit = 6,
}) => {
  const recent = useStoredList(RECENT)
  if (!recent.length) return null

  return (
    <section aria-labelledby="recent-title" className="page">
      <SectionHeading
        id="recent-title"
        title={title}
        intro="Recipes you opened recently on this device"
      />
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        {recent.slice(0, limit).map(recipe => (
          <li key={recipe.recipeId}>
            <RecipeCard recipe={recipe} variant="row" />
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => clearList(RECENT)}
        className="mt-6 text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        Clear history
      </button>
    </section>
  )
}

export default RecentlyViewed
