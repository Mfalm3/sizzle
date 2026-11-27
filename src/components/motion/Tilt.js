import React from "react"
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "motion/react"
import { useFancyPointer } from "../../lib/media"
import { pointerSpring } from "../../lib/motion"

// Tilts toward the pointer in 3D with a soft light glare. Mouse only; static elsewhere.
const Tilt = ({ children, className = "", max = 7 }) => {
  const enabled = useFancyPointer()
  const rotateX = useSpring(0, pointerSpring)
  const rotateY = useSpring(0, pointerSpring)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255, 252, 246, 0.38), transparent 60%)`

  if (!enabled) return <div className={className}>{children}</div>

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={event => {
        const box = event.currentTarget.getBoundingClientRect()
        const px = (event.clientX - box.left) / box.width
        const py = (event.clientY - box.top) / box.height
        rotateY.set((px - 0.5) * max * 2)
        rotateX.set((0.5 - py) * max * 2)
        gx.set(px * 100)
        gy.set(py * 100)
      }}
      onPointerLeave={() => {
        rotateX.set(0)
        rotateY.set(0)
      }}
    >
      {children}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: glare }}
      />
    </motion.div>
  )
}

export default Tilt
