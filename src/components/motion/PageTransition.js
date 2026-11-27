import React, { useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useReducedMotion } from "../../lib/media"
import { ease, easeInOut } from "../../lib/motion"
import { setRevealReady } from "../../lib/reveal"

// Page change: a herb-green plate grows out of the point you clicked until it covers the
// screen, the next page mounts underneath, and the cover lifts away like a curtain.
// With reduced motion it is a short crossfade instead.

let origin = null
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointerdown",
    e => (origin = [e.clientX, e.clientY]),
    { capture: true, passive: true }
  )
  window.addEventListener("keydown", () => (origin = null), {
    capture: true,
    passive: true,
  })
}
const plate = radius =>
  origin
    ? `circle(${radius} at ${origin[0]}px ${origin[1]}px)`
    : `circle(${radius} at 50% 50%)`

// Gatsby's own scroll restoration would jump the old page before the cover is up,
// so gatsby-browser queues the target here and we apply it while the screen is covered.
let pendingScroll = null
export const queueScroll = target => (pendingScroll = target)
const applyScroll = () => {
  const target = pendingScroll
  pendingScroll = null
  if (typeof target === "string")
    document
      .getElementById(decodeURIComponent(target.slice(1)))
      ?.scrollIntoView()
  else if (target)
    window.scrollTo({ left: target[0], top: target[1], behavior: "instant" })
  // Screen readers and keyboards start on the new page's content, not wherever focus was.
  document.getElementById("main")?.focus({ preventScroll: true })
}

const Curtain = () => (
  <motion.div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-[45] flex items-center justify-center bg-herb"
    initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
    animate={{
      clipPath: "inset(0% 0% 100% 0%)",
      transition: { duration: 0.6, ease: easeInOut, delay: 0.05 },
    }}
    exit="cover"
    variants={{
      cover: () => ({
        clipPath: [plate("0%"), plate("150%")],
        transition: { duration: 0.5, ease },
      }),
    }}
    onAnimationComplete={definition =>
      definition !== "cover" && setRevealReady(true)
    }
  >
    <motion.svg
      viewBox="0 0 32 32"
      className="h-20 w-20"
      initial={{ scale: 1, rotate: 0, opacity: 1 }}
      animate={{
        scale: 0.5,
        rotate: 120,
        opacity: 0,
        transition: { duration: 0.5, ease },
      }}
      exit="cover"
      variants={{
        cover: {
          scale: [0.3, 1],
          rotate: [-120, 0],
          opacity: [0, 1],
          transition: { duration: 0.6, ease },
        },
      }}
    >
      <circle cx="16" cy="16" r="10" fill="#FFFCF6" />
      <circle cx="16" cy="16" r="5.5" fill="#D99A1E" />
    </motion.svg>
  </motion.div>
)

const PageTransition = ({ children, location }) => {
  const reduce = useReducedMotion()

  useEffect(() => {
    // Lets the failsafe in gatsby-ssr know scroll reveals are live.
    window.__sizzleHydrated = true
  }, [])

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => requestAnimationFrame(applyScroll)}
    >
      <motion.div
        key={location.pathname}
        {...(reduce && {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.2 },
          onAnimationComplete: () => setRevealReady(true),
        })}
      >
        {children}
        {!reduce && <Curtain />}
      </motion.div>
    </AnimatePresence>
  )
}

export default PageTransition
