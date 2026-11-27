import { useSyncExternalStore } from "react"

// matchMedia as a hook. The server snapshot is false, so first render matches the static HTML.
export const useMedia = query =>
  useSyncExternalStore(
    notify => {
      const list = window.matchMedia(query)
      list.addEventListener("change", notify)
      return () => list.removeEventListener("change", notify)
    },
    () => window.matchMedia(query).matches,
    () => false
  )

// Motion's own useReducedMotion reads matchMedia on the first client render, which breaks
// hydration when it differs from the server's guess; this one agrees with the HTML first.
export const useReducedMotion = () =>
  useMedia("(prefers-reduced-motion: reduce)")

// Pointer-driven effects (tilt, magnetic pull, cursor preview) need a mouse and a user
// who hasn't asked for reduced motion.
export const useFancyPointer = () => {
  const finePointer = useMedia("(hover: hover) and (pointer: fine)")
  const reduce = useReducedMotion()
  return finePointer && !reduce
}
