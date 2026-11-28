import React, { useDeferredValue, useEffect, useMemo, useState } from "react"
import { Link, graphql } from "gatsby"
import { AnimatePresence, motion } from "motion/react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Icon from "../components/Icon"
import Drawer from "../components/Drawer"
import RecipeCard from "../components/RecipeCard"
import RecipeFilters from "../components/RecipeFilters"
import SplitText from "../components/motion/SplitText"
import AnimatedNumber from "../components/motion/AnimatedNumber"
import EmptyPlate from "../components/EmptyPlate"
import { ease } from "../lib/motion"
import { reveal } from "../lib/reveal"
import {
  EMPTY_FILTERS,
  SORTS,
  activeFilterCount,
  filterRecipes,
  filtersFromSearch,
  filtersToSearch,
} from "../lib/filterRecipes"

const PAGE_SIZE = 24

const RecipesPage = ({ data, location }) => {
  const recipes = data.allRecipe.nodes
  // Starts empty so the server HTML and first client render agree; the URL is applied after mount.
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [visible, setVisible] = useState(PAGE_SIZE)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const deferred = useDeferredValue(filters)

  useEffect(
    () => setFilters(filtersFromSearch(location.search)),
    [location.search]
  )

  const update = changes => {
    const next = { ...filters, ...changes }
    setFilters(next)
    setVisible(PAGE_SIZE)
    window.history.replaceState(
      window.history.state,
      "",
      `${location.pathname}${filtersToSearch(next)}`
    )
  }

  const cuisines = useMemo(() => {
    const counts = {}
    recipes.forEach(
      r => r.cuisine && (counts[r.cuisine] = (counts[r.cuisine] || 0) + 1)
    )
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [recipes])

  const results = useMemo(
    () => filterRecipes(recipes, deferred),
    [recipes, deferred]
  )
  const sortValue =
    !filters.q && filters.sort === "relevance" ? "name" : filters.sort
  const filterCount = activeFilterCount(filters)
  const summary = [filters.category, filters.cuisine]
    .filter(Boolean)
    .join(" and ")

  return (
    <Layout showSearch={false}>
      <header className="page pb-8 pt-8 lg:pt-12">
        <SplitText
          as="h1"
          text={filters.q ? `Recipes with “${filters.q}”` : "Find a recipe"}
          className="text-display-lg"
        />
        <p
          ref={reveal}
          data-reveal="up"
          style={{ "--i": 3 }}
          className="mt-3 max-w-prose text-lg text-muted"
        >
          Search {recipes.length} recipes by dish name, or by an ingredient you
          already have
        </p>

        <form
          ref={reveal}
          data-reveal="up"
          style={{ "--i": 4 }}
          role="search"
          className="relative mt-8 max-w-2xl"
          onSubmit={event => event.preventDefault()}
        >
          <label htmlFor="recipe-search" className="sr-only">
            Search by dish or ingredient
          </label>
          <Icon
            name="search"
            className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
          />
          <input
            id="recipe-search"
            type="search"
            value={filters.q}
            onChange={event => update({ q: event.target.value })}
            placeholder="Dish or ingredient, e.g. “chickpeas spinach”"
            autoComplete="off"
            className="input min-h-[3.5rem] pl-12 text-lg"
          />
        </form>
        <p className="mt-3 text-sm text-muted">
          Already have some ingredients?{" "}
          <Link to="/pantry" className="link">
            See what you can cook with them
          </Link>
        </p>
      </header>

      <nav aria-label="Categories" className="page">
        <ul className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {[{ name: "", label: "All" }, ...data.allCategory.nodes].map(
            (c, i) => (
              <li
                key={c.name || "all"}
                ref={reveal}
                data-reveal="up"
                style={{ "--i": 5 + i * 0.4 }}
                className="shrink-0"
              >
                <button
                  type="button"
                  aria-pressed={filters.category === c.name}
                  onClick={() => update({ category: c.name })}
                  className="chip relative"
                >
                  {filters.category === c.name && (
                    <motion.span
                      layoutId="category-pill"
                      className="absolute inset-0 rounded-full bg-herb"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  )}
                  <span className="relative">{c.label || c.name}</span>
                </button>
              </li>
            )
          )}
        </ul>
      </nav>

      <div className="page mt-8 grid gap-10 lg:grid-cols-[15rem_1fr] lg:gap-14">
        <aside aria-label="Filters" className="hidden lg:block">
          <RecipeFilters
            filters={filters}
            update={update}
            cuisines={cuisines}
            idPrefix="side"
          />
        </aside>

        <section aria-label="Results">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <p className="text-muted" aria-live="polite">
              <span className="font-semibold text-ink">
                <AnimatedNumber value={results.length} />
              </span>{" "}
              {results.length === 1 ? "recipe" : "recipes"}
              {summary && <> in {summary}</>}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-quiet lg:hidden"
                onClick={() => setDrawerOpen(true)}
              >
                <Icon name="filter" />
                Filters{filterCount > 0 && ` (${filterCount})`}
              </button>
              <label htmlFor="sort" className="sr-only">
                Sort by
              </label>
              <select
                id="sort"
                value={sortValue}
                onChange={event => update({ sort: event.target.value })}
                className="select w-auto"
              >
                {Object.entries(SORTS)
                  .filter(([key]) => key !== "relevance" || filters.q)
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {results.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col items-center py-16 text-center"
            >
              <EmptyPlate className="w-56" />
              <h2 className="mt-6 text-display-sm">No recipes match that</h2>
              <p className="mt-2 max-w-sm text-muted">
                {filters.q
                  ? "Try a single ingredient, a shorter word, or fewer filters"
                  : "Loosen a filter or two to see more recipes"}
              </p>
              <button
                type="button"
                className="btn-primary mt-6"
                onClick={() => update({ ...EMPTY_FILTERS })}
              >
                Show all recipes
              </button>
            </motion.div>
          ) : (
            <>
              {/* Filtering reflows the grid: cards that stay glide to their new places,
                  new ones grow in, removed ones shrink away. */}
              <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {results.slice(0, visible).map((recipe, i) => (
                    <motion.li
                      key={recipe.recipeId}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 30 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 },
                      }}
                      transition={{
                        duration: 0.5,
                        ease,
                        delay: Math.min(i % PAGE_SIZE, 8) * 0.03,
                      }}
                    >
                      <RecipeCard
                        recipe={recipe}
                        headingLevel="h2"
                        index={i % 3}
                      />
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
        </section>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
      >
        <RecipeFilters
          filters={filters}
          update={update}
          cuisines={cuisines}
          idPrefix="drawer"
        />
        <button
          type="button"
          className="btn-primary mt-10 w-full"
          onClick={() => setDrawerOpen(false)}
        >
          Show {results.length} {results.length === 1 ? "recipe" : "recipes"}
        </button>
      </Drawer>
    </Layout>
  )
}

export const Head = () => (
  <Seo
    title="Find a recipe"
    description="Search hundreds of recipes by dish or ingredient, and filter by category, cuisine and shopping-list length."
  />
)

export default RecipesPage

export const query = graphql`
  query RecipesPage {
    allRecipe(sort: { name: ASC }) {
      nodes {
        ...RecipeCard
        tags
        ingredientNames
        youtube
        updatedAt
      }
    }
    allCategory(sort: { recipeCount: DESC }) {
      nodes {
        name
      }
    }
  }
`
