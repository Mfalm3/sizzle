// Saved and recently viewed recipes, kept on this device until accounts exist.
import { useSyncExternalStore } from "react"

export const SAVED = "sizzle:saved"
export const RECENT = "sizzle:recent"

const EMPTY = []
const cache = {}
const listeners = new Set()

const read = key => {
  if (!(key in cache)) {
    try {
      const value = JSON.parse(window.localStorage.getItem(key))
      cache[key] = Array.isArray(value)
        ? value.filter(r => r && r.recipeId && r.slug)
        : EMPTY
    } catch {
      cache[key] = EMPTY
    }
  }
  return cache[key]
}

const write = (key, list) => {
  cache[key] = list
  try {
    window.localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // Private mode or full storage: keep the in-memory list for this visit.
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

export const useStoredList = key =>
  useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY
  )

const summary = ({
  recipeId,
  slug,
  name,
  category,
  cuisine,
  image,
  ingredientCount,
}) => ({
  recipeId,
  slug,
  name,
  category,
  cuisine,
  image,
  ingredientCount,
})

export const toggleSaved = recipe => {
  const list = read(SAVED)
  const saved = list.some(r => r.recipeId === recipe.recipeId)
  write(
    SAVED,
    saved
      ? list.filter(r => r.recipeId !== recipe.recipeId)
      : [summary(recipe), ...list]
  )
  return !saved
}

export const addRecent = recipe =>
  write(
    RECENT,
    [
      summary(recipe),
      ...read(RECENT).filter(r => r.recipeId !== recipe.recipeId),
    ].slice(0, 12)
  )

export const clearList = key => write(key, [])
