import React, { useEffect } from "react"
import { motion, useSpring, useTransform } from "motion/react"
import { useReducedMotion } from "../../lib/media"

// Counts up or down to a new value. The rolling digits are hidden from screen readers,
// which get the final number only.
const AnimatedNumber = ({ value }) => {
  const reduce = useReducedMotion()
  const spring = useSpring(value, { stiffness: 140, damping: 22 })
  const display = useTransform(spring, v => Math.round(v))

  useEffect(() => {
    if (reduce) spring.jump(value)
    else spring.set(value)
  }, [value, reduce, spring])

  return (
    <>
      <motion.span aria-hidden="true" className="tabular-nums">
        {display}
      </motion.span>
      <span className="sr-only">{value}</span>
    </>
  )
}

export default AnimatedNumber
