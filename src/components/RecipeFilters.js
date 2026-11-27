import React from "react"
import { INGREDIENT_LIMITS, activeFilterCount } from "../lib/filterRecipes"

// Cuisine, shopping-list length and video filters. Rendered in the sidebar on desktop and a drawer on mobile.
const RecipeFilters = ({ filters, update, cuisines, idPrefix }) => (
  <div className="space-y-8">
    <div>
      <label htmlFor={`${idPrefix}-cuisine`} className="text-sm font-semibold">
        Cuisine
      </label>
      <select
        id={`${idPrefix}-cuisine`}
        value={filters.cuisine}
        onChange={event => update({ cuisine: event.target.value })}
        className="select mt-2"
      >
        <option value="">All cuisines</option>
        {cuisines.map(c => (
          <option key={c.name} value={c.name}>
            {c.name} ({c.count})
          </option>
        ))}
      </select>
    </div>

    <fieldset>
      <legend className="text-sm font-semibold">Shopping list</legend>
      <div className="mt-2 space-y-1">
        {[["", "Any length"], ...Object.entries(INGREDIENT_LIMITS)].map(
          ([value, label]) => (
            <label
              key={value || "any"}
              className="flex min-h-[2.5rem] cursor-pointer items-center gap-3"
            >
              <input
                type="radio"
                name={`${idPrefix}-max`}
                value={value}
                checked={filters.max === value}
                onChange={() => update({ max: value })}
                className="h-4 w-4 accent-herb"
              />
              {value ? `${label} ingredients` : label}
            </label>
          )
        )}
      </div>
    </fieldset>

    <label className="flex min-h-[2.5rem] cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={filters.video}
        onChange={event => update({ video: event.target.checked })}
        className="h-5 w-5 rounded accent-herb"
      />
      Has a cooking video
    </label>

    {activeFilterCount(filters) > 0 && (
      <button
        type="button"
        onClick={() =>
          update({ category: "", cuisine: "", max: "", video: false })
        }
        className="text-sm font-semibold text-herb underline underline-offset-4"
      >
        Clear filters
      </button>
    )}
  </div>
)

export default RecipeFilters
