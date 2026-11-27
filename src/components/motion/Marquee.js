import React, { useState } from "react"
import Icon from "../Icon"

// Endless ribbon of words in outlined display type. Decorative: the cuisine index below has the
// real links. It pauses on hover and from its own button (WCAG 2.2.2), and stands still for
// reduced motion.
const Marquee = ({ items, label }) => {
  const [paused, setPaused] = useState(false)

  return (
    <div className="relative overflow-hidden border-y border-line py-6 sm:py-8">
      <div
        aria-hidden="true"
        className={`marquee flex w-max ${paused ? "marquee-paused" : ""}`}
      >
        {[0, 1].map(copy => (
          <ul key={copy} className="flex shrink-0 items-center">
            {items.map((item, i) => (
              <li key={item} className="flex items-center">
                <span
                  className={`font-display text-[clamp(3rem,9vw,7.5rem)] leading-none ${
                    i % 2 ? "text-outline" : "text-ink"
                  }`}
                >
                  {item}
                </span>
                <svg
                  viewBox="0 0 32 32"
                  className="mx-8 h-8 w-8 shrink-0 sm:mx-12 sm:h-10 sm:w-10"
                >
                  <circle cx="16" cy="16" r="14" fill="#2F4B33" />
                  <circle cx="16" cy="16" r="9" fill="#FFFCF6" />
                  <circle cx="16" cy="16" r="4.5" fill="#D99A1E" />
                </svg>
              </li>
            ))}
          </ul>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setPaused(p => !p)}
        className="btn-icon touch-target absolute bottom-2 right-3 h-9 w-9 motion-reduce:hidden"
        aria-label={paused ? `Play ${label}` : `Pause ${label}`}
        aria-pressed={paused}
      >
        <Icon name={paused ? "play" : "pause"} className="h-4 w-4" />
      </button>
    </div>
  )
}

export default Marquee
