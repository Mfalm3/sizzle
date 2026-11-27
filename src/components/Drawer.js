import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import Icon from "./Icon"
import { fade, sheet } from "../lib/motion"

// Right-hand sheet for the mobile menu and filters: traps focus, closes on Escape or backdrop.
const Drawer = ({ open, onClose, title, children }) => {
  const panel = useRef(null)
  // Portalled to <body> so a transformed ancestor (the hiding header) can't trap the fixed panel.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"
    // A field marked data-autofocus (the menu's search box) wins over the first control (Close).
    const panelEl = panel.current
    ;(
      panelEl?.querySelector("[data-autofocus]") ||
      panelEl?.querySelector("button, a, input, select")
    )?.focus()

    const onKey = event => {
      if (event.key === "Escape") close.current()
      if (event.key !== "Tab") return
      const items = panel.current.querySelectorAll(
        "button, a[href], input, select"
      )
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener("keydown", onKey)
      opener?.focus?.()
    }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="drawer" className="fixed inset-0 z-50" data-noprint>
          <motion.div
            {...fade}
            className="absolute inset-0 bg-ink/40"
            onClick={onClose}
          />
          <motion.div
            {...sheet}
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-paper shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="font-display text-display-sm">{title}</p>
              <button
                type="button"
                onClick={onClose}
                className="btn-icon"
                aria-label="Close"
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export default Drawer
