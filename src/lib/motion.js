// Shared motion timing so every transition in the site moves the same way.
export const ease = [0.22, 1, 0.36, 1]
export const easeInOut = [0.76, 0, 0.24, 1]

// Springs for pointer-following effects: snappy, no wobble.
export const pointerSpring = { stiffness: 220, damping: 22, mass: 0.5 }

export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.15 } },
  transition: { duration: 0.2, ease },
}

export const sheet = {
  initial: { x: "100%" },
  animate: { x: 0 },
  // Exits run faster than entrances and accelerate away, so closing feels instant.
  exit: { x: "100%", transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } },
  transition: { duration: 0.45, ease },
}
