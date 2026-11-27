import React, { useDeferredValue, useEffect, useMemo, useState } from "react"
import { graphql } from "gatsby"
import { AnimatePresence, motion } from "motion/react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import RecipeCard from "../components/RecipeCard"
import EmptyPlate from "../components/EmptyPlate"
import IngredientInput from "../components/IngredientInput"
import PhotoScan from "../components/PhotoScan"
import SplitText from "../components/motion/SplitText"
import AnimatedNumber from "../components/motion/AnimatedNumber"
import { ease } from "../lib/motion"
import { reveal } from "../lib/reveal"
import {
  BASICS_LABEL,
  DIETS,
  SORTS,
  ingredientMatches,
  normalizeIngredient,
  pantryFromSearch,
  pantryToSearch,
  recommend,
} from "../lib/pantry"

const PAGE_SIZE = 24
const EMPTY = {
  have: [],
  exclude: [],
  diet: "",
  assumeBasics: true,
  sort: "match",
}
const EXAMPLE = ["tomatoes", "onions", "eggs", "spinach", "cheese"]

const list = (names, max = 4) =>
  names.length > max
    ? `${names.slice(0, max).join(", ")} and ${names.length - max} more`
    : names.join(", ")

// Why a recipe was suggested: how much of it you can make, and exactly what's missing.
const MatchSummary = ({ result }) => {
  const { matched, missing, basics, needed, percent } = result
  return (
    <div className="mt-3 rounded-xl border border-line bg-surface p-3.5 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">
          {matched.length} of {needed} ingredients
        </span>
        <span className="tabular-nums text-muted">{percent}% match</span>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
        aria-hidden="true"
      >
        <motion.div
          className="h-full origin-left rounded-full bg-herb"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: percent / 100 }}
          transition={{ duration: 0.7, ease }}
        />
      </div>
      {missing.length ? (
        <p className="mt-2.5">
          <span className="text-muted">Missing </span>
          {list(missing)}
        </p>
      ) : (
        <p className="mt-2.5 font-semibold text-herb">You have everything</p>
      )}
      <p className="mt-1 text-muted">
        You have {list(matched)}
        {basics.length > 0 && <>, plus basics ({list(basics, 3)})</>}
      </p>
    </div>
  )
}

const PantryPage = ({ data, location }) => {
  const recipes = data.allRecipe.nodes
  // Starts empty so the server HTML and first client render agree; the URL is applied after mount.
  const [state, setState] = useState(EMPTY)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const deferred = useDeferredValue(state)

  useEffect(
    () => setState(pantryFromSearch(location.search)),
    [location.search]
  )

  const update = changes => {
    const next = { ...state, ...changes }
    setState(next)
    setVisible(PAGE_SIZE)
    window.history.replaceState(
      window.history.state,
      "",
      `${location.pathname}${pantryToSearch(next)}`
    )
  }

  // Every distinct ingredient in the collection, most used first: the suggestion list, and the
  // check that flags a chip no recipe uses.
  const catalog = useMemo(() => {
    const byKey = new Map()
    for (const recipe of recipes) {
      for (const name of recipe.ingredientNames) {
        const n = normalizeIngredient(name)
        if (!n.key) continue
        const entry = byKey.get(n.key) || {
          n,
          label: name.toLowerCase(),
          count: 0,
        }
        entry.count += 1
        byKey.set(n.key, entry)
      }
    }
    return [...byKey.values()].sort((a, b) => b.count - a.count)
  }, [recipes])

  const isKnown = name => {
    const n = normalizeIngredient(name)
    return catalog.some(entry => ingredientMatches(n, entry.n))
  }

  // Ingredients read from a photo join the list, skipping any already on it.
  const addScanned = names => {
    const keys = new Set(state.have.map(name => normalizeIngredient(name).key))
    const fresh = names.filter(name => {
      const key = normalizeIngredient(name).key
      if (!key || keys.has(key)) return false
      keys.add(key)
      return true
    })
    if (fresh.length) update({ have: [...state.have, ...fresh] })
  }

  const results = useMemo(
    () => recommend(recipes, deferred),
    [recipes, deferred]
  )
  const hasIngredients = state.have.length > 0

  return (
    <Layout>
      <header className="page pb-8 pt-8 lg:pt-12">
        <SplitText
          as="h1"
          text="Cook with what you have"
          className="text-display-lg"
        />
        <p
          ref={reveal}
          data-reveal="up"
          style={{ "--i": 3 }}
          className="mt-3 max-w-prose text-lg text-muted"
        >
          Add the ingredients in your kitchen to see which recipes use them, and
          what you'd still need to buy
        </p>
      </header>

      <datalist id="ingredient-suggestions">
        {catalog.map(entry => (
          <option key={entry.n.key} value={entry.label} />
        ))}
      </datalist>

      <section aria-label="Your ingredients" className="page">
        <div
          ref={reveal}
          data-reveal="up"
          style={{ "--i": 4 }}
          className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
        >
          <IngredientInput
            id="have"
            label="Ingredients you have"
            hint="Press Enter or type a comma after each one. You can paste a whole list."
            placeholder="e.g. tomatoes, eggs, spinach"
            values={state.have}
            onChange={have => update({ have })}
            suggestionsId="ingredient-suggestions"
            isKnown={isKnown}
          />
          {!hasIngredients && (
            <button
              type="button"
              className="link mt-3 text-sm"
              onClick={() => update({ have: EXAMPLE })}
            >
              Try an example: {EXAMPLE.join(", ")}
            </button>
          )}
          <PhotoScan onAdd={addScanned} isKnown={isKnown} />

          <div className="mt-6 grid gap-6 border-t border-line pt-6 md:grid-cols-[1.4fr_1fr]">
            <IngredientInput
              id="exclude"
              label="Leave out"
              hint="Recipes with these are skipped, including products made from them"
              placeholder="e.g. peanuts, pork"
              values={state.exclude}
              onChange={exclude => update({ exclude })}
              suggestionsId="ingredient-suggestions"
            />
            <div className="space-y-5">
              <fieldset>
                <legend className="text-sm font-semibold">Diet</legend>
                <div className="mt-2 inline-flex rounded-full border border-line bg-paper p-1">
                  {[["", "Any"], ...Object.entries(DIETS)].map(
                    ([value, label]) => (
                      <label
                        key={label}
                        className="touch-target relative cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="diet"
                          value={value}
                          checked={state.diet === value}
                          onChange={() => update({ diet: value })}
                          className="peer sr-only"
                        />
                        <span
                          className={`relative flex min-h-[2.25rem] items-center rounded-full px-4 text-sm font-semibold transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-saffron ${
                            state.diet === value
                              ? "text-surface"
                              : "text-muted hover:text-ink"
                          }`}
                        >
                          {state.diet === value && (
                            <motion.span
                              layoutId="diet-pill"
                              className="absolute inset-0 rounded-full bg-herb"
                              transition={{
                                type: "spring",
                                stiffness: 480,
                                damping: 34,
                              }}
                            />
                          )}
                          <span className="relative">{label}</span>
                        </span>
                      </label>
                    )
                  )}
                </div>
                {state.diet && (
                  <p className="mt-2 text-sm text-muted">
                    Worked out from ingredient names, so check the recipe if it
                    matters
                  </p>
                )}
              </fieldset>
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={state.assumeBasics}
                  onChange={event =>
                    update({ assumeBasics: event.target.checked })
                  }
                  className="mt-0.5 h-5 w-5 shrink-0 rounded accent-herb"
                />
                <span>
                  I have {BASICS_LABEL}
                  <span className="block text-muted">
                    They won't count as missing
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Recipes you can make" className="page mt-10">
        {!hasIngredients ? (
          <div className="flex flex-col items-center py-12 text-center">
            <EmptyPlate className="w-56" />
            <h2 className="mt-6 text-display-sm">What's in your kitchen?</h2>
            <p className="mt-2 max-w-sm text-muted">
              Add a few ingredients above and matching recipes appear here
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
              <p className="text-muted" aria-live="polite">
                <span className="font-semibold text-ink">
                  <AnimatedNumber value={results.length} />
                </span>{" "}
                {results.length === 1 ? "recipe uses" : "recipes use"} your
                ingredients
              </p>
              <div className="flex flex-col items-end gap-1">
                <label htmlFor="pantry-sort" className="sr-only">
                  Sort by
                </label>
                <select
                  id="pantry-sort"
                  value={state.sort}
                  onChange={event => update({ sort: event.target.value })}
                  className="select w-auto"
                >
                  {Object.entries(SORTS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
                {state.sort === "steps" && (
                  <p className="text-xs text-muted">
                    Fewest method steps. Recipes don't list cooking times.
                  </p>
                )}
              </div>
            </div>

            {results.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <EmptyPlate className="w-56" />
                <h2 className="mt-6 text-display-sm">No recipes use those</h2>
                <p className="mt-2 max-w-sm text-muted">
                  {state.exclude.length || state.diet
                    ? "Try fewer exclusions or a different diet"
                    : "Check the spelling, or add a more common ingredient"}
                </p>
              </div>
            ) : (
              <>
                <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {results.slice(0, visible).map((result, i) => (
                      <motion.li
                        key={result.recipe.recipeId}
                        layout
                        initial={{ opacity: 0, scale: 0.92, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          scale: 0.92,
                          transition: { duration: 0.2 },
                        }}
                        transition={{
                          duration: 0.45,
                          ease,
                          delay: Math.min(i % PAGE_SIZE, 8) * 0.03,
                        }}
                      >
                        <RecipeCard
                          recipe={result.recipe}
                          headingLevel="h2"
                          index={i % 3}
                        />
                        <MatchSummary result={result} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {visible < results.length && (
                  <div className="mt-14 flex flex-col items-center gap-3">
                    <p className="text-sm text-muted">
                      Showing {visible} of {results.length}
                    </p>
                    <button
                      type="button"
                      className="btn-quiet"
                      onClick={() => setVisible(v => v + PAGE_SIZE)}
                    >
                      Show {Math.min(PAGE_SIZE, results.length - visible)} more
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </section>
    </Layout>
  )
}

export const Head = () => (
  <Seo
    title="Cook with what you have"
    description="Find recipes you can make with the ingredients already in your kitchen, and see exactly what's missing."
  />
)

export default PantryPage

export const query = graphql`
  query PantryPage {
    allRecipe(sort: { name: ASC }) {
      nodes {
        ...RecipeCard
        ingredientNames
        stepCount
      }
    }
  }
`
