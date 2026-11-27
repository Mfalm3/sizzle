import React, { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import SplitText from "../motion/SplitText"
import { scaleMeasure } from "../../lib/quantity"
import { reveal } from "../../lib/reveal"
import { ease } from "../../lib/motion"

const FACTORS = [
  { value: 0.5, label: "½×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
  { value: 3, label: "3×" },
]

// Shopping list with batch scaling and tick-off. TheMealDB lists no servings, so we scale by batch.
// The batch pill slides between options, quantities flip to their new values, ticks draw themselves
// and a saffron line strikes through what's ready.
const Ingredients = ({ ingredients }) => {
  const [factor, setFactor] = useState(1)
  const [checked, setChecked] = useState(() => new Set())
  const toggle = index =>
    setChecked(prev => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })

  return (
    <section aria-labelledby="ingredients-title">
      <div className="flex items-baseline justify-between gap-4">
        <SplitText
          as="h2"
          id="ingredients-title"
          text="Ingredients"
          className="text-display-md"
        />
        <p
          className="text-sm tabular-nums text-muted"
          aria-live="polite"
          data-noprint
        >
          {checked.size} of {ingredients.length} ready
        </p>
      </div>
      <div
        className="mt-3 h-1 overflow-hidden rounded-full bg-line"
        data-noprint
      >
        <motion.div
          className="h-full origin-left rounded-full bg-saffron"
          initial={false}
          animate={{ scaleX: checked.size / ingredients.length }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3" data-noprint>
        <span id="batch-label" className="text-sm text-muted">
          Batch size
        </span>
        <div
          role="group"
          aria-labelledby="batch-label"
          className="inline-flex rounded-full border border-line bg-surface p-1"
        >
          {FACTORS.map(f => {
            const active = factor === f.value
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setFactor(f.value)}
                className={`touch-target relative min-h-[2.25rem] min-w-[2.75rem] rounded-full px-3 text-sm font-semibold transition-colors duration-300 ${
                  active ? "text-surface" : "text-muted hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="batch-pill"
                    className="absolute inset-0 rounded-full bg-herb"
                    transition={{ type: "spring", stiffness: 480, damping: 34 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <ul className="mt-5 divide-y divide-line border-y border-line">
        {ingredients.map((ingredient, index) => {
          const done = checked.has(index)
          return (
            <li
              key={`${ingredient.name}-${index}`}
              ref={reveal}
              data-reveal="up"
              style={{ "--i": Math.min(index, 10) * 0.6 }}
            >
              <label className="flex cursor-pointer items-start gap-3 py-3">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => toggle(index)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  data-noprint
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-saffron peer-focus-visible:ring-offset-2 ${
                    done ? "border-herb bg-herb" : "border-muted/50 bg-surface"
                  }`}
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
                    <motion.path
                      d="m5 12.5 4.5 4.5L19 7.5"
                      fill="none"
                      stroke="#FFFCF6"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: done ? 1 : 0 }}
                      transition={{ duration: 0.3, ease }}
                    />
                  </svg>
                </span>
                <span className={`strike ${done ? "strike-on" : ""}`}>
                  {ingredient.measure && (
                    <>
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={factor}
                          className="inline-block font-semibold"
                          initial={{ y: "-70%", opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: "70%", opacity: 0 }}
                          transition={{ duration: 0.3, ease }}
                        >
                          {scaleMeasure(ingredient.measure, factor)}
                        </motion.span>
                      </AnimatePresence>{" "}
                    </>
                  )}
                  {ingredient.name}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {checked.size > 0 && (
        <button
          type="button"
          onClick={() => setChecked(new Set())}
          className="mt-3 text-sm text-muted underline underline-offset-4 hover:text-ink"
          data-noprint
        >
          Clear ticks
        </button>
      )}
    </section>
  )
}

export default Ingredients
