import React, { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { useReducedMotion } from "../../lib/media"

// A plate that keeps turning as the page scrolls.
export const ScrollSpin = ({ children, className = "", turn = 90 }) => {
  const reduce = useReducedMotion()
  const { scrollY } = useScroll()
  const rotate = useTransform(scrollY, [0, 1200], [0, turn])
  return (
    <motion.div className={className} style={reduce ? undefined : { rotate }}>
      {children}
    </motion.div>
  )
}

// Image drifts inside its frame while the frame crosses the viewport.
export const Parallax = ({ children, className = "", offset = 48 }) => {
  const ref = useRef(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset])
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        className="h-full w-full"
        style={reduce ? undefined : { y, scale: 1.14 }}
      >
        {children}
      </motion.div>
    </div>
  )
}
