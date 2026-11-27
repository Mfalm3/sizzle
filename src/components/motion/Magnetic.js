import React from "react"
import { motion, useSpring } from "motion/react"
import { useFancyPointer } from "../../lib/media"

// Pulls its child toward the pointer while hovered, then springs back.
const Magnetic = ({ children, strength = 0.3, className = "" }) => {
  const enabled = useFancyPointer()
  const spring = { stiffness: 180, damping: 14, mass: 0.4 }
  const x = useSpring(0, spring)
  const y = useSpring(0, spring)

  return (
    <motion.span
      className={`inline-block ${className}`}
      style={enabled ? { x, y } : undefined}
      onPointerMove={
        enabled
          ? event => {
              const box = event.currentTarget.getBoundingClientRect()
              x.set((event.clientX - (box.left + box.width / 2)) * strength)
              y.set((event.clientY - (box.top + box.height / 2)) * strength)
            }
          : undefined
      }
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </motion.span>
  )
}

export default Magnetic
