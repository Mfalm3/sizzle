import React, { useEffect, useRef, useState } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { useMedia, useReducedMotion } from "../../lib/media"

// The pinned version. Kept in its own component so useScroll binds to the section element:
// useScroll reads its target once on mount, and the section only exists once pinning is on.
const PinnedRow = ({ heading, children, label }) => {
  const section = useRef(null)
  const track = useRef(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const measure = () =>
      track.current &&
      setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track.current)
    window.addEventListener("resize", measure)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  const { scrollYProgress } = useScroll({
    target: section,
    offset: ["start start", "end end"],
  })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])

  // A focused card may sit off-screen in the sliding row: scroll the page so it slides into view.
  // The frame uses overflow: clip (not hidden) so focus can't scroll it sideways on its own.
  const showFocused = event => {
    const item = event.target.closest("li")
    if (!item) return
    // Browsers without overflow: clip scroll the frame itself toward the focused card; undo that.
    event.currentTarget.parentElement.scrollLeft = 0
    const top = section.current.getBoundingClientRect().top + window.scrollY
    window.scrollTo({
      top: top + Math.min(Math.max(0, item.offsetLeft - 64), distance),
      behavior: "instant",
    })
  }

  return (
    <div
      ref={section}
      className="relative"
      style={{ height: `calc(100vh + ${distance}px)` }}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden supports-[overflow:clip]:overflow-clip">
        <div className="page">{heading}</div>
        <motion.ul
          ref={track}
          aria-label={label}
          style={{ x }}
          onFocus={showFocused}
          className="flex w-max gap-8 px-8 pb-4 xl:px-[max(2rem,calc((100vw-78rem)/2+2rem))]"
        >
          {children}
        </motion.ul>
        <div className="page mt-6">
          <div className="h-px bg-line">
            <motion.div
              className="h-px origin-left bg-herb"
              style={{ scaleX: scrollYProgress }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// On large screens the section pins while vertical scrolling slides the row sideways.
// On small screens, or with reduced motion, it is an ordinary swipeable row.
const HorizontalScroll = ({ heading, children, label }) => {
  const wide = useMedia("(min-width: 1024px)")
  const reduce = useReducedMotion()

  if (wide && !reduce) {
    return (
      <PinnedRow heading={heading} label={label}>
        {children}
      </PinnedRow>
    )
  }

  return (
    <div className="page">
      {heading}
      <ul
        aria-label={label}
        className="no-scrollbar -mx-5 flex snap-x scroll-px-5 gap-6 overflow-x-auto px-5 pb-6 pt-2 sm:-mx-8 sm:scroll-px-8 sm:px-8"
      >
        {children}
      </ul>
    </div>
  )
}

export default HorizontalScroll
