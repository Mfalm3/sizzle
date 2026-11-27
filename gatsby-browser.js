import React from "react"
import { MotionConfig } from "motion/react"
import PageTransition, {
  queueScroll,
} from "./src/components/motion/PageTransition"
import { setRevealReady } from "./src/lib/reveal"
import { TimerProvider } from "./src/components/recipe/useTimers"
import "./src/styles/global.css"

// "user" turns transform animations off when the OS asks for reduced motion.
// Timers live here, above the page transitions, so they keep running between pages.
export const wrapRootElement = ({ element }) => (
  <MotionConfig reducedMotion="user">
    <TimerProvider>{element}</TimerProvider>
  </MotionConfig>
)

export const wrapPageElement = ({ element, props }) => (
  <PageTransition location={props.location}>{element}</PageTransition>
)

// Hold scroll reveals while the transition covers the screen; the curtain releases them.
export const onPreRouteUpdate = ({ location, prevLocation }) => {
  if (prevLocation && prevLocation.pathname !== location.pathname)
    setRevealReady(false)
}

// Across pages, scroll happens under the cover (see PageTransition); within a page, Gatsby's default.
export const shouldUpdateScroll = ({
  prevRouterProps,
  routerProps: { location },
  getSavedScrollPosition,
}) => {
  if (
    !prevRouterProps ||
    prevRouterProps.location.pathname === location.pathname
  )
    return true
  queueScroll(location.hash || getSavedScrollPosition(location) || [0, 0])
  return false
}
