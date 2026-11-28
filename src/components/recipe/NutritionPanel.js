import React, { useEffect, useState } from "react"
import { Link } from "gatsby"
import { AnimatePresence, motion } from "motion/react"
import SplitText from "../motion/SplitText"
import AnimatedNumber from "../motion/AnimatedNumber"
import Icon from "../Icon"
import { ease } from "../../lib/motion"
import { MEALS, dayKey, logServing, mealForHour } from "../../lib/foodLog"

const SERVINGS_KEY = "sizzle:servings"
const LABELS = {
  kcal: "Calories",
  protein: "Protein",
  carbs: "Carbohydrates",
  fat: "Fat",
  fiber: "Fibre",
  sugar: "Sugars",
  sodium: "Sodium",
}
const UNITS = {
  kcal: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
  fiber: "g",
  sugar: "g",
  sodium: "mg",
}
// Energy per gram (Atwater factors), for the protein / carbs / fat split.
const ENERGY = [
  { key: "protein", per: 4, className: "bg-herb", label: "Protein" },
  { key: "carbs", per: 4, className: "bg-saffron", label: "Carbohydrates" },
  { key: "fat", per: 9, className: "bg-ink/40", label: "Fat" },
]

const fmt = (value, unit) => {
  if (value === null || value === undefined) return "–"
  const rounded =
    unit === "kcal" || unit === "mg" || value >= 10
      ? Math.round(value)
      : Math.round(value * 10) / 10
  return `${rounded.toLocaleString("en")} ${unit}`
}

// Servings per recipe, remembered on this device. 1 means "the whole recipe".
const readServings = slug => {
  try {
    const all = JSON.parse(window.localStorage.getItem(SERVINGS_KEY)) || {}
    const n = Number(all[slug])
    return Number.isInteger(n) && n >= 1 && n <= 24 ? n : 1
  } catch {
    return 1
  }
}
const saveServings = (slug, n) => {
  try {
    const all = JSON.parse(window.localStorage.getItem(SERVINGS_KEY)) || {}
    all[slug] = n
    window.localStorage.setItem(SERVINGS_KEY, JSON.stringify(all))
  } catch {
    // Storage unavailable: the choice just won't be remembered.
  }
}

// Estimated nutrition for a recipe, computed at build time from USDA data (utils/nutrition/calc.js).
// Shows exactly how much of the recipe was counted and why anything wasn't.
const NutritionPanel = ({ recipe }) => {
  const { totals, partial, counted, total, items } = recipe.nutrition
  const [servings, setServings] = useState(1)
  const [meal, setMeal] = useState("dinner")
  const [logged, setLogged] = useState(null)

  // Read after mount so the server HTML (whole recipe) and first client render agree.
  useEffect(() => {
    setServings(readServings(recipe.slug))
    setMeal(mealForHour(new Date().getHours()))
  }, [recipe.slug])

  const changeServings = n => {
    const next = Math.min(24, Math.max(1, n))
    setServings(next)
    saveServings(recipe.slug, next)
    setLogged(null)
  }

  if (!counted) {
    return (
      <section
        aria-labelledby="nutrition-title"
        className="rounded-2xl border border-line bg-surface p-6"
      >
        <h2 id="nutrition-title" className="text-display-sm">
          Nutrition
        </h2>
        <p className="mt-2 text-muted">
          None of this recipe's ingredients could be matched to USDA data with a
          usable amount, so there's no estimate
        </p>
      </section>
    )
  }

  const per = key => (totals[key] === null ? null : totals[key] / servings)
  const isPartial = key => partial.includes(key)
  const energy = ENERGY.map(e => ({ ...e, kcal: (per(e.key) || 0) * e.per }))
  const energyTotal = energy.reduce((t, e) => t + e.kcal, 0) || 1
  const notCounted = items.filter(i => i.reason)
  const scope = servings === 1 ? "the whole recipe" : "one serving"

  const log = () => {
    const entry = logServing({
      recipe,
      servings: 1 / servings,
      meal,
      date: dayKey(),
      nutrients: {
        kcal: per("kcal"),
        protein: per("protein"),
        carbs: per("carbs"),
        fat: per("fat"),
        partial: counted < total,
      },
    })
    setLogged(entry)
  }

  return (
    <section aria-labelledby="nutrition-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <SplitText
            as="h2"
            id="nutrition-title"
            text="Nutrition"
            className="text-display-md"
          />
          <p className="mt-2 text-muted">
            Estimated from USDA data for {counted} of {total} ingredients
          </p>
        </div>

        <div className="flex items-center gap-3" data-noprint>
          <span id="servings-label" className="text-sm text-muted">
            Servings
          </span>
          <div
            role="group"
            aria-labelledby="servings-label"
            className="inline-flex items-center rounded-full border border-line bg-surface p-1"
          >
            <button
              type="button"
              className="touch-target flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-paper disabled:opacity-40"
              onClick={() => changeServings(servings - 1)}
              disabled={servings <= 1}
              aria-label="Fewer servings"
            >
              −
            </button>
            <output
              aria-live="polite"
              className="min-w-[7.5rem] text-center text-sm font-semibold tabular-nums"
            >
              {servings === 1 ? "Whole recipe" : `Divide into ${servings}`}
            </output>
            <button
              type="button"
              className="touch-target flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-paper disabled:opacity-40"
              onClick={() => changeServings(servings + 1)}
              disabled={servings >= 24}
              aria-label="More servings"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:grid-cols-[minmax(0,16rem)_1fr]">
        <div>
          <p className="text-sm text-muted">Calories in {scope}</p>
          <p className="mt-1 font-display text-display-lg leading-none">
            <AnimatedNumber value={Math.round(per("kcal"))} />
            <span className="ml-2 font-sans text-lg text-muted">kcal</span>
          </p>
          {counted < total && (
            <p className="mt-2 text-sm text-muted">
              Likely higher: {total - counted} ingredients aren't counted
            </p>
          )}
        </div>

        <div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {["protein", "carbs", "fat", "fiber"].map(key => (
              <div key={key}>
                <dt className="text-sm text-muted">{LABELS[key]}</dt>
                <dd className="mt-0.5 font-display text-xl tabular-nums">
                  {isPartial(key) && <span className="text-muted">≥ </span>}
                  {fmt(per(key), UNITS[key])}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-5">
            <p className="text-sm text-muted">Where the calories come from</p>
            <div
              className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-line"
              aria-hidden="true"
            >
              {energy.map(e => (
                <motion.div
                  key={e.key}
                  className={`h-full ${e.className}`}
                  initial={false}
                  animate={{ width: `${(e.kcal / energyTotal) * 100}%` }}
                  transition={{ duration: 0.6, ease }}
                />
              ))}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {energy.map(e => (
                <li key={e.key} className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${e.className}`}
                    aria-hidden="true"
                  />
                  {e.label} {Math.round((e.kcal / energyTotal) * 100)}%
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3" data-noprint>
        <label htmlFor="log-meal" className="sr-only">
          Meal
        </label>
        <select
          id="log-meal"
          value={meal}
          onChange={event => setMeal(event.target.value)}
          className="select w-auto"
        >
          {Object.entries(MEALS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" onClick={log}>
          Log {servings === 1 ? "the whole recipe" : "one serving"} for today
        </button>
        <AnimatePresence>
          {logged && (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="flex items-center gap-1.5 text-sm"
              role="status"
            >
              <Icon name="check" className="h-4 w-4 text-herb" />
              Logged {Math.round(logged.kcal)} kcal to{" "}
              {MEALS[logged.meal].toLowerCase()}.{" "}
              <Link to="/food-log" className="link">
                Open food log
              </Link>
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <details
        className="group mt-6 rounded-2xl border border-line bg-surface"
        open={false}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
          Full breakdown
          <svg
            viewBox="0 0 12 12"
            className="h-3 w-3 text-muted transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden="true"
          >
            <path d="M2 4l4 4 4-4" />
          </svg>
        </summary>
        <div className="border-t border-line px-5 pb-5 pt-4">
          <table className="w-full max-w-md text-sm">
            <caption className="sr-only">Nutrients in {scope}</caption>
            <tbody>
              {Object.keys(LABELS).map(key => (
                <tr key={key} className="border-b border-line last:border-0">
                  <th
                    scope="row"
                    className="py-2 text-left font-normal text-muted"
                  >
                    {LABELS[key]}
                  </th>
                  <td className="py-2 text-right tabular-nums">
                    {isPartial(key) && (
                      <span className="text-muted">at least </span>
                    )}
                    {fmt(per(key), UNITS[key])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="mt-6 font-sans text-sm font-semibold">
            By ingredient (whole recipe)
          </h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="text-left text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 font-medium">
                    Ingredient
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Amount
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    Weight
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    kcal
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={`${item.name}-${i}`}
                    className="border-b border-line align-top last:border-0"
                  >
                    <td className="py-2 pr-3">
                      {item.name}
                      <span className="block text-xs text-muted">
                        {item.reason
                          ? `Not counted: ${item.reason}`
                          : `${item.approx ? "≈ " : ""}USDA: ${item.food}`}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-muted">
                      {item.measure || "–"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {item.grams ? `${Math.round(item.grams)} g` : "–"}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {item.nutrients ? Math.round(item.nutrients.kcal) : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {notCounted.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              {notCounted.length}{" "}
              {notCounted.length === 1
                ? "ingredient isn't"
                : "ingredients aren't"}{" "}
              counted, so the real totals are likely higher.
            </p>
          )}
        </div>
      </details>

      <p className="mt-4 text-sm text-muted">
        Estimates from the recipe's amounts and USDA FoodData Central (SR
        Legacy). “≈” marks the closest USDA food. Frying oil is counted in full,
        though only part of it is absorbed. This is general information, not
        dietary advice.
      </p>
    </section>
  )
}

export default NutritionPanel
