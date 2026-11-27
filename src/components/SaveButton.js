import React, { useState } from "react"
import { motion } from "motion/react"
import { useReducedMotion } from "../lib/media"
import Icon from "./Icon"
import { SAVED, toggleSaved, useStoredList } from "../lib/storage"
import { ease } from "../lib/motion"

const SPARKS = Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2)

// Heart toggle. `labelled` shows the word next to the icon (recipe page); cards use the icon alone.
// Saving pops the heart and throws a ring of saffron sparks.
const SaveButton = ({ recipe, labelled = false, className = "" }) => {
  const saved = useStoredList(SAVED).some(r => r.recipeId === recipe.recipeId)
  const [burst, setBurst] = useState(0)
  const reduce = useReducedMotion()
  const label = saved
    ? `Remove ${recipe.name} from saved`
    : `Save ${recipe.name}`

  return (
    <button
      type="button"
      onClick={event => {
        event.preventDefault()
        if (toggleSaved(recipe)) setBurst(b => b + 1)
      }}
      aria-pressed={saved}
      aria-label={labelled ? undefined : label}
      title={labelled ? undefined : label}
      className={`${labelled ? "btn-quiet" : "btn-icon"} ${className}`}
    >
      <span className="relative">
        <motion.span
          key={saved ? "on" : "off"}
          className={`block ${saved ? "text-saffron-deep" : ""}`}
          initial={{ scale: saved ? 0.4 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 14 }}
        >
          <Icon name="heart" filled={saved} />
        </motion.span>
        {burst > 0 && !reduce && (
          <span
            key={burst}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            {SPARKS.map(angle => (
              <motion.span
                key={angle}
                className="absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-saffron"
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos(angle) * 22,
                  y: Math.sin(angle) * 22,
                  scale: 0.3,
                  opacity: 0,
                }}
                transition={{ duration: 0.6, ease }}
              />
            ))}
          </span>
        )}
      </span>
      {labelled && (saved ? "Saved" : "Save")}
    </button>
  )
}

export default SaveButton
