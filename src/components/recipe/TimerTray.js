import React, { useState } from "react"
import { Link } from "gatsby"
import { AnimatePresence, motion } from "motion/react"
import Icon from "../Icon"
import { formatClock, stepHref } from "../../lib/timers"
import { ease } from "../../lib/motion"

const RING = 2 * Math.PI * 15

const Ring = ({ remaining, done }) => (
  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
    <svg
      viewBox="0 0 36 36"
      className="absolute inset-0 -rotate-90"
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke="#E3D9C7"
        strokeWidth="3"
      />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke={done ? "#A6720C" : "#2F4B33"}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={RING}
        strokeDashoffset={RING * (1 - remaining)}
        style={{ transition: "stroke-dashoffset 0.25s linear" }}
      />
    </svg>
    <Icon name="clock" className="h-4 w-4 text-ink" />
  </span>
)

// Floating list of timers, rendered at the app root so it follows you between pages.
// Each shows its recipe, step and countdown; tapping one opens the step it's timing, with a
// link that scrolls the recipe to that step and highlights it. Finished timers pulse until dismissed.
const TimerTray = ({ timers, now, onRemove }) => {
  const [openId, setOpenId] = useState(null)

  return (
    <div
      data-noprint
      aria-label="Timers"
      role="region"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[46] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6"
    >
      <AnimatePresence initial={false}>
        {timers.map(timer => {
          const left = Math.max(0, (timer.endsAt - now) / 1000)
          const remaining = timer.done ? 0 : left / timer.seconds
          const open = openId === timer.id
          const detailsId = `timer-${timer.id}-details`

          return (
            <motion.div
              key={timer.id}
              layout="position"
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={
                timer.done
                  ? { opacity: 1, y: 0, scale: [1, 1.04, 1] }
                  : { opacity: 1, y: 0, scale: 1 }
              }
              exit={{ opacity: 0, x: 80, transition: { duration: 0.25, ease } }}
              transition={
                timer.done
                  ? { scale: { duration: 0.6, repeat: 4 } }
                  : { type: "spring", stiffness: 380, damping: 28 }
              }
              className={`pointer-events-auto w-full overflow-hidden rounded-2xl border shadow-lift sm:w-80 ${
                timer.done
                  ? "border-saffron bg-saffron-soft"
                  : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center gap-3 py-2.5 pl-3 pr-2">
                <Ring remaining={remaining} done={timer.done} />
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : timer.id)}
                  aria-expanded={open}
                  aria-controls={detailsId}
                  className="group min-w-0 flex-1 rounded-lg text-left"
                >
                  <span className="block truncate text-sm font-semibold group-hover:text-herb">
                    {timer.recipe.name}
                  </span>
                  <span className="block text-sm text-muted">
                    Step {timer.step}, {timer.label}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-display text-xl tabular-nums">
                      {timer.done ? "Time's up" : formatClock(left)}
                    </span>
                    <svg
                      viewBox="0 0 12 12"
                      className={`h-3 w-3 text-muted transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden="true"
                    >
                      <path d="M2 4l4 4 4-4" />
                    </svg>
                    <span className="sr-only">
                      {open ? "Hide" : "Show"} what this timer is for
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(timer.id)}
                  className="btn-icon touch-target h-10 w-10 border-transparent bg-transparent"
                  aria-label={`${timer.done ? "Dismiss" : "Cancel"} ${
                    timer.recipe.name
                  } step ${timer.step} timer`}
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>

              {/* Announced once when the timer finishes, wherever focus is */}
              {timer.done && (
                <p role="alert" className="sr-only">
                  Time's up: {timer.recipe.name}, step {timer.step}
                </p>
              )}

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    id={detailsId}
                    key="details"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.3, ease }}
                    className="border-t border-line px-4 pb-4 pt-3"
                  >
                    {timer.section && (
                      <p className="text-sm font-semibold text-herb">
                        {timer.section}
                      </p>
                    )}
                    <p className="mt-1 line-clamp-5 text-sm leading-relaxed">
                      {timer.stepText ||
                        `Step ${timer.step} of ${timer.recipe.name}`}
                    </p>
                    <Link
                      to={stepHref(timer)}
                      onClick={() => setOpenId(null)}
                      className="link mt-3 inline-flex items-center gap-1.5 text-sm"
                    >
                      Show step {timer.step} in the recipe
                      <Icon name="arrow" className="h-4 w-4" />
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default TimerTray
