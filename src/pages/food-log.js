import React, { useEffect, useState } from "react"
import { Link } from "gatsby"
import { AnimatePresence, motion } from "motion/react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Icon from "../components/Icon"
import EmptyPlate from "../components/EmptyPlate"
import SplitText from "../components/motion/SplitText"
import AnimatedNumber from "../components/motion/AnimatedNumber"
import { ease } from "../lib/motion"
import {
  MEALS,
  dayKey,
  dayTotals,
  history,
  removeEntry,
  setCalorieTarget,
  shiftDay,
  useCalorieTarget,
  useFoodLog,
} from "../lib/foodLog"

const formatDay = (key, today) => {
  if (key === today) return "Today"
  if (key === shiftDay(today, -1)) return "Yesterday"
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}
const shortDay = key => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { weekday: "short" })
}

// A personal food log kept on this device. Totals come from the recipes' USDA estimates.
const FoodLogPage = () => {
  const entries = useFoodLog()
  const target = useCalorieTarget()
  // Today is only known in the browser; render a neutral state on the server.
  const [today, setToday] = useState(null)
  const [day, setDay] = useState(null)
  const [targetInput, setTargetInput] = useState("")

  useEffect(() => {
    const now = dayKey()
    setToday(now)
    setDay(now)
  }, [])
  useEffect(() => setTargetInput(target ? String(target) : ""), [target])

  if (!today) {
    return (
      <Layout>
        <header className="page pb-8 pt-8 lg:pt-12">
          <SplitText as="h1" text="Food log" className="text-display-lg" />
        </header>
      </Layout>
    )
  }

  const totals = dayTotals(entries, day)
  const week = history(entries, today, 7)
  const weekMax = Math.max(...week.map(d => d.kcal), target || 0, 1)
  const remaining = target ? target - totals.kcal : null
  const hasPartial = entries.some(e => e.date === day && e.partial)

  return (
    <Layout>
      <header className="page pb-8 pt-8 lg:pt-12">
        <SplitText as="h1" text="Food log" className="text-display-lg" />
        <p className="mt-3 max-w-prose text-lg text-muted">
          What you've logged from recipes, kept on this device only. Calories
          are estimates from USDA data.
        </p>
      </header>

      <div className="page grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-14">
        <section aria-labelledby="day-title">
          <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
            <button
              type="button"
              className="btn-icon"
              onClick={() => setDay(shiftDay(day, -1))}
              aria-label="Previous day"
            >
              <Icon name="arrow" className="h-5 w-5 rotate-180" />
            </button>
            <h2
              id="day-title"
              className="text-center text-display-sm"
              aria-live="polite"
            >
              {formatDay(day, today)}
            </h2>
            <button
              type="button"
              className="btn-icon disabled:opacity-40"
              onClick={() => setDay(shiftDay(day, 1))}
              disabled={day >= today}
              aria-label="Next day"
            >
              <Icon name="arrow" className="h-5 w-5" />
            </button>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            <div className="bg-surface p-4">
              <dt className="text-sm text-muted">Calories</dt>
              <dd className="mt-1 font-display text-display-sm tabular-nums">
                <AnimatedNumber value={totals.kcal} />{" "}
                <span className="font-sans text-sm text-muted">kcal</span>
              </dd>
            </div>
            {[
              ["protein", "Protein"],
              ["carbs", "Carbohydrates"],
              ["fat", "Fat"],
            ].map(([key, label]) => (
              <div key={key} className="bg-surface p-4">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 font-display text-display-sm tabular-nums">
                  {totals[key]}{" "}
                  <span className="font-sans text-sm text-muted">g</span>
                </dd>
              </div>
            ))}
          </dl>
          {target && (
            <p className="mt-3 text-sm">
              {remaining >= 0 ? (
                <>
                  <span className="font-semibold">
                    {remaining.toLocaleString("en")} kcal
                  </span>{" "}
                  <span className="text-muted">
                    left of your {target.toLocaleString("en")} kcal target
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold">
                    {Math.abs(remaining).toLocaleString("en")} kcal
                  </span>{" "}
                  <span className="text-muted">
                    over your {target.toLocaleString("en")} kcal target
                  </span>
                </>
              )}
            </p>
          )}
          {hasPartial && (
            <p className="mt-1 text-sm text-muted">
              Some recipes here have ingredients that couldn't be counted, so
              the real total is likely higher
            </p>
          )}

          {totals.count === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <EmptyPlate className="w-48" />
              <p className="mt-6 font-display text-display-sm">
                Nothing logged {day === today ? "today" : "this day"}
              </p>
              <p className="mt-2 max-w-sm text-muted">
                Open a recipe and use “Log” in its nutrition section
              </p>
              <Link to="/recipes" className="btn-primary mt-6">
                Find a recipe
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {Object.entries(MEALS).map(([meal, label]) => {
                const list = totals.byMeal[meal]
                if (!list.length) return null
                return (
                  <section key={meal} aria-labelledby={`meal-${meal}`}>
                    <h3
                      id={`meal-${meal}`}
                      className="flex items-baseline justify-between font-sans text-sm font-semibold"
                    >
                      {label}
                      <span className="font-normal tabular-nums text-muted">
                        {Math.round(list.reduce((t, e) => t + e.kcal, 0))} kcal
                      </span>
                    </h3>
                    <ul className="mt-2 divide-y divide-line border-y border-line">
                      <AnimatePresence initial={false}>
                        {list.map(entry => (
                          <motion.li
                            key={entry.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{
                              opacity: 0,
                              x: 40,
                              transition: { duration: 0.2 },
                            }}
                            transition={{ duration: 0.3, ease }}
                            className="flex items-center gap-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <Link
                                to={`/recipes/${entry.recipe.slug}/#nutrition`}
                                className="font-semibold hover:text-herb"
                              >
                                {entry.recipe.name}
                              </Link>
                              <p className="text-sm text-muted">
                                {entry.servings === 1
                                  ? "Whole recipe"
                                  : `1 of ${Math.round(
                                      1 / entry.servings
                                    )} servings`}
                              </p>
                            </div>
                            <span className="tabular-nums">
                              {Math.round(entry.kcal)} kcal
                            </span>
                            <button
                              type="button"
                              className="btn-icon touch-target h-9 w-9 border-transparent bg-transparent"
                              onClick={() => removeEntry(entry.id)}
                              aria-label={`Remove ${
                                entry.recipe.name
                              } from ${label.toLowerCase()}`}
                            >
                              <Icon name="close" className="h-4 w-4" />
                            </button>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  </section>
                )
              })}
            </div>
          )}
        </section>

        <aside className="space-y-8">
          <section
            aria-labelledby="target-title"
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <h2 id="target-title" className="font-sans text-base font-semibold">
              Daily target
            </h2>
            <p className="mt-1 text-sm text-muted">
              Optional, and yours to choose. Sizzle doesn't recommend one.
            </p>
            <form
              className="mt-3 flex gap-2"
              onSubmit={event => {
                event.preventDefault()
                setCalorieTarget(targetInput)
              }}
            >
              <label htmlFor="target" className="sr-only">
                Daily calorie target in kcal
              </label>
              <input
                id="target"
                type="number"
                inputMode="numeric"
                min="1"
                max="19999"
                value={targetInput}
                onChange={event => setTargetInput(event.target.value)}
                placeholder="kcal"
                className="input [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button type="submit" className="btn-quiet shrink-0">
                Save
              </button>
            </form>
            {target && (
              <button
                type="button"
                className="mt-2 text-sm text-muted underline underline-offset-4"
                onClick={() => setCalorieTarget("")}
              >
                Remove target
              </button>
            )}
          </section>

          <section aria-labelledby="week-title">
            <h2 id="week-title" className="font-sans text-base font-semibold">
              Last 7 days
            </h2>
            <ul className="mt-3 space-y-2">
              {week.map(d => (
                <li key={d.date}>
                  <button
                    type="button"
                    onClick={() => setDay(d.date)}
                    aria-current={d.date === day ? "date" : undefined}
                    className="grid w-full grid-cols-[3rem_1fr_4.5rem] items-center gap-3 rounded-lg px-1 py-1 text-left text-sm hover:bg-surface"
                  >
                    <span
                      className={
                        d.date === day ? "font-semibold" : "text-muted"
                      }
                    >
                      {shortDay(d.date)}
                    </span>
                    <span className="relative h-2 rounded-full bg-line">
                      <motion.span
                        className={`absolute inset-y-0 left-0 rounded-full ${
                          d.date === day ? "bg-herb" : "bg-muted/40"
                        }`}
                        initial={false}
                        animate={{ width: `${(d.kcal / weekMax) * 100}%` }}
                        transition={{ duration: 0.5, ease }}
                      />
                      {target && (
                        <span
                          className="absolute inset-y-[-3px] w-px bg-saffron-deep"
                          style={{ left: `${(target / weekMax) * 100}%` }}
                          aria-hidden="true"
                        />
                      )}
                    </span>
                    <span className="text-right tabular-nums">
                      {d.kcal ? `${d.kcal.toLocaleString("en")}` : "–"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {target && (
              <p className="mt-2 text-xs text-muted">
                The thin line marks your target
              </p>
            )}
          </section>
        </aside>
      </div>
    </Layout>
  )
}

export const Head = () => <Seo title="Food log" noindex />

export default FoodLogPage
