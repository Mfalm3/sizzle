import React, { useEffect, useRef } from "react"
import { motion, useScroll } from "motion/react"
import { useReducedMotion } from "../../lib/media"
import Icon from "../Icon"
import SplitText from "../motion/SplitText"
import Magnetic from "../motion/Magnetic"
import { findDurations } from "../../lib/timers"
import { reveal, whenRevealReady } from "../../lib/reveal"

// Numbered method, grouped under the source's section titles where it has them.
// Numbers run on across sections so a timer's "Step 7" matches what's on screen.
// A saffron line fills down the numerals as you read, and each numeral lights up as its step arrives.
// Any duration in a step ("simmer for 20 minutes") becomes a timer button.
// Each step has an anchor (#step-3). Arriving at one (from a timer in the tray, say) centres the
// step, moves focus to it and plays a highlight, once any page transition has finished.
const Method = ({ sections, onStartTimer, location }) => {
  const list = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: list,
    offset: ["start 75%", "end 60%"],
  })
  let number = 0

  // location.key changes on every navigation, so following the same step link twice replays it.
  useEffect(() => {
    const match = location?.hash?.match(/^#step-(\d+)$/)
    if (!match) return
    let timeout
    const cancel = whenRevealReady(() => {
      const step = document.getElementById(`step-${match[1]}`)
      if (!step) return
      step.scrollIntoView({
        block: "center",
        behavior: reduce ? "auto" : "smooth",
      })
      step.focus({ preventScroll: true })
      // Restart the animation even if this step is already highlighted.
      step.removeAttribute("data-highlight")
      void step.offsetWidth
      step.setAttribute("data-highlight", "")
      timeout = setTimeout(() => step.removeAttribute("data-highlight"), 3200)
    })
    return () => {
      cancel()
      clearTimeout(timeout)
    }
  }, [location?.hash, location?.key, reduce])

  return (
    <section aria-labelledby="method-title">
      <SplitText
        as="h2"
        id="method-title"
        text="Method"
        className="text-display-md"
      />
      <div ref={list} className="relative">
        <div
          aria-hidden="true"
          data-noprint
          className="absolute bottom-4 left-[1.25rem] top-10 w-0.5 -translate-x-1/2 rounded-full bg-line sm:left-[1.75rem]"
        >
          <motion.div
            className="h-full w-full origin-top rounded-full bg-saffron"
            style={{ scaleY: reduce ? 1 : scrollYProgress }}
          />
        </div>

        {sections.map((section, s) => (
          <div key={s} className="mt-8">
            {section.title && (
              <h3
                ref={reveal}
                data-reveal="up"
                className="relative mb-5 ml-[3.5rem] border-b border-line pb-2 text-display-sm text-herb sm:ml-[4.5rem]"
              >
                {section.title}
              </h3>
            )}
            <ol className="space-y-10" start={number + 1}>
              {section.steps.map(step => {
                number += 1
                const n = number
                const durations = findDurations(step)
                return (
                  <li
                    key={n}
                    id={`step-${n}`}
                    tabIndex={-1}
                    ref={reveal}
                    data-reveal="up"
                    className="step relative isolate grid scroll-mt-28 grid-cols-[2.5rem_1fr] gap-4 sm:grid-cols-[3.5rem_1fr]"
                  >
                    <span
                      aria-hidden="true"
                      className="step-num relative flex justify-center bg-surface py-1 font-display text-display-md leading-none text-saffron-deep print:bg-transparent"
                    >
                      {n}
                    </span>
                    <div className="max-w-prose">
                      <p className="sr-only">Step {n}</p>
                      <p className="text-[1.0625rem] leading-[1.75]">{step}</p>
                      {durations.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2" data-noprint>
                          {durations.map(d => (
                            <Magnetic key={d.seconds} strength={0.2}>
                              <button
                                type="button"
                                onClick={() =>
                                  onStartTimer({
                                    label: d.label,
                                    seconds: d.seconds,
                                    step: n,
                                    stepText: step,
                                    section: section.title,
                                  })
                                }
                                className="chip group"
                              >
                                <Icon
                                  name="clock"
                                  className="h-4 w-4 text-herb transition-transform duration-500 group-hover:rotate-[360deg]"
                                />
                                Start {d.label} timer
                              </button>
                            </Magnetic>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Method
