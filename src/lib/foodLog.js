// A personal food log kept on this device (localStorage): servings of recipes eaten, grouped by
// day and meal, with an optional daily calorie target the person sets themselves. A foundation
// for tracking, not dietary advice; there are no recommended targets anywhere.
import { useSyncExternalStore } from "react"

export const MEALS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
}
const LOG_KEY = "sizzle:food-log"
const TARGET_KEY = "sizzle:kcal-target"

// Local calendar date, not UTC, so a late dinner lands on the right day.
export const dayKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`
}

export const shiftDay = (key, days) => {
  const [y, m, d] = key.split("-").map(Number)
  return dayKey(new Date(y, m - 1, d + days))
}

export const mealForHour = hour =>
  hour < 11
    ? "breakfast"
    : hour < 15
    ? "lunch"
    : hour < 17
    ? "snack"
    : hour < 22
    ? "dinner"
    : "snack"

const NUMBERS = ["kcal", "protein", "carbs", "fat"]
const isEntry = e =>
  e !== null &&
  typeof e === "object" &&
  typeof e.id === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
  e.meal in MEALS &&
  typeof e.recipe?.name === "string" &&
  /^[a-z0-9-]+$/.test(e.recipe?.slug ?? "") &&
  Number.isFinite(e.servings) &&
  e.servings > 0 &&
  NUMBERS.every(k => Number.isFinite(e[k]) && e[k] >= 0)

// Stored data is editable by anyone with devtools: keep only well-formed entries.
export const parseLog = raw => {
  try {
    const value = JSON.parse(raw)
    return Array.isArray(value) ? value.filter(isEntry) : []
  } catch {
    return []
  }
}

export const parseTarget = raw => {
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 && n < 20000 ? Math.round(n) : null
}

export const dayTotals = (entries, date) => {
  const today = entries.filter(e => e.date === date)
  const sum = key => Math.round(today.reduce((total, e) => total + e[key], 0))
  const byMeal = Object.fromEntries(
    Object.keys(MEALS).map(meal => [meal, today.filter(e => e.meal === meal)])
  )
  return {
    kcal: sum("kcal"),
    protein: sum("protein"),
    carbs: sum("carbs"),
    fat: sum("fat"),
    byMeal,
    count: today.length,
  }
}

// Calories per day for the `days` days ending on `endDate`, oldest first.
export const history = (entries, endDate, days = 7) =>
  Array.from({ length: days }, (_, i) => {
    const date = shiftDay(endDate, i - days + 1)
    return {
      date,
      kcal: Math.round(
        entries.filter(e => e.date === date).reduce((t, e) => t + e.kcal, 0)
      ),
    }
  })

// ---- Store: one cached snapshot per key, shared by every component that reads it ----
const cache = {}
const listeners = new Set()
const read = (key, parse, fallback) => {
  if (!(key in cache)) {
    try {
      cache[key] = parse(window.localStorage.getItem(key))
    } catch {
      cache[key] = fallback
    }
  }
  return cache[key]
}
const write = (key, value) => {
  cache[key] = value
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: keep the in-memory value for this visit.
  }
  listeners.forEach(notify => notify())
}
const subscribe = notify => {
  const onStorage = event => {
    if (event.key in cache) {
      delete cache[event.key]
      notify()
    }
  }
  listeners.add(notify)
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(notify)
    window.removeEventListener("storage", onStorage)
  }
}

const EMPTY = []
export const useFoodLog = () =>
  useSyncExternalStore(
    subscribe,
    () => read(LOG_KEY, parseLog, EMPTY),
    () => EMPTY
  )
export const useCalorieTarget = () =>
  useSyncExternalStore(
    subscribe,
    () => read(TARGET_KEY, parseTarget, null),
    () => null
  )

export const logServing = ({
  recipe,
  servings,
  meal,
  nutrients,
  date = dayKey(),
}) => {
  const entry = {
    id: `${Date.now()}-${recipe.slug}`,
    date,
    meal,
    recipe: { name: recipe.name, slug: recipe.slug },
    servings,
    partial: Boolean(nutrients.partial),
    ...Object.fromEntries(
      NUMBERS.map(k => [k, Math.round(nutrients[k] * 10) / 10])
    ),
  }
  write(LOG_KEY, [...read(LOG_KEY, parseLog, EMPTY), entry])
  return entry
}

export const removeEntry = id =>
  write(
    LOG_KEY,
    read(LOG_KEY, parseLog, EMPTY).filter(e => e.id !== id)
  )
export const setCalorieTarget = value => write(TARGET_KEY, parseTarget(value))
