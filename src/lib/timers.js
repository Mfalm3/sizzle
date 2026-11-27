// Finds cooking durations in a method step so each can become a one-tap timer.

const DURATION =
  /(\d+(?:\.\d+)?)(?:\s*(?:-|–|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|minutes?|mins?)\b/gi

export const findDurations = step => {
  const found = new Map()
  for (const match of step.matchAll(DURATION)) {
    const [, low, high, unit] = match
    // Ranges start at the low end: easier to add a minute than to rescue a burnt dish.
    const seconds = Math.round(Number(low) * (/^h/i.test(unit) ? 3600 : 60))
    if (seconds > 0 && !found.has(seconds)) {
      const label = high
        ? `${low}–${high} ${/^h/i.test(unit) ? "hr" : "min"}`
        : formatDuration(seconds)
      found.set(seconds, { seconds, label })
    }
  }
  return [...found.values()].slice(0, 3)
}

export const formatDuration = seconds => {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h && m) return `${h} hr ${m} min`
  if (h) return `${h} hr`
  return `${m} min`
}

export const formatClock = seconds => {
  const s = Math.max(0, Math.ceil(seconds))
  const h = Math.floor(s / 3600)
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, "0")
  const ss = String(s % 60).padStart(2, "0")
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`
}

// Timers saved in sessionStorage come back through here. Storage is editable by anyone with
// devtools, so keep only well-formed timers; the slug ends up in a link, so it must look like one.
const isTimer = t =>
  t !== null &&
  typeof t === "object" &&
  typeof t.id === "string" &&
  typeof t.label === "string" &&
  Number.isInteger(t.step) &&
  t.step > 0 &&
  Number.isFinite(t.seconds) &&
  t.seconds > 0 &&
  Number.isFinite(t.endsAt) &&
  typeof t.done === "boolean" &&
  typeof t.recipe?.name === "string" &&
  /^[a-z0-9-]+$/.test(t.recipe?.slug ?? "") &&
  (t.stepText === undefined || typeof t.stepText === "string") &&
  (t.section === undefined ||
    t.section === null ||
    typeof t.section === "string")

export const parseStoredTimers = raw => {
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value.filter(isTimer) : []
  } catch {
    return []
  }
}

// Where a timer points: the step's anchor on its recipe page.
export const stepHref = timer =>
  `/recipes/${timer.recipe.slug}/#step-${timer.step}`
