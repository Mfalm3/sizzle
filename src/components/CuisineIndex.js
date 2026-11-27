import React, { useState } from "react"
import { Link } from "gatsby"
import { AnimatePresence, motion, useSpring } from "motion/react"
import { useFancyPointer } from "../lib/media"
import { reveal } from "../lib/reveal"
import { ease } from "../lib/motion"

// Typographic list of cuisines. With a mouse, a plate of that cuisine's food follows the pointer.
const CuisineIndex = ({ cuisines }) => {
  const fancy = useFancyPointer()
  const [active, setActive] = useState(null)
  const x = useSpring(0, { stiffness: 260, damping: 28, mass: 0.6 })
  const y = useSpring(0, { stiffness: 260, damping: 28, mass: 0.6 })

  return (
    <div
      // Enter: jump to the pointer so the plate doesn't fly in from the corner; move: follow with a spring.
      onPointerEnter={
        fancy ? e => (x.jump(e.clientX), y.jump(e.clientY)) : undefined
      }
      onPointerMove={
        fancy ? e => (x.set(e.clientX), y.set(e.clientY)) : undefined
      }
      onPointerLeave={() => setActive(null)}
    >
      <ul className="columns-2 gap-x-10 sm:columns-3 lg:columns-4">
        {cuisines.map((cuisine, i) => (
          <li
            key={cuisine.name}
            ref={reveal}
            data-reveal="up"
            style={{ "--i": i % 6 }}
            className="break-inside-avoid"
          >
            <Link
              to={`/recipes?cuisine=${encodeURIComponent(cuisine.name)}`}
              onPointerEnter={() => setActive(cuisine)}
              className="group flex items-baseline justify-between gap-3 border-b border-line py-3"
            >
              <span className="font-display text-xl transition-[transform,color] duration-300 ease-out group-hover:translate-x-2 group-hover:text-herb">
                {cuisine.name}
              </span>
              <span className="text-sm tabular-nums text-muted">
                {cuisine.recipeCount}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {fancy && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-30 -mt-60 ml-6 h-56 w-56"
          style={{ x, y }}
        >
          <AnimatePresence>
            {active && (
              <motion.img
                key={active.name}
                src={`${active.image}/medium`}
                alt=""
                className="plate absolute inset-0 h-full w-full object-cover"
                initial={{ scale: 0, rotate: -40, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0.4, rotate: 40, opacity: 0 }}
                transition={{ duration: 0.45, ease }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

export default CuisineIndex
