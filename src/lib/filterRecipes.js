// Search, filter and sort for the recipe index. Filters live in the URL so results can be shared.

export const SORTS = {
  relevance: "Best match",
  updated: "Recently updated",
  name: "A to Z",
  ingredients: "Fewest ingredients",
}

export const INGREDIENT_LIMITS = {
  7: "7 or fewer",
  10: "10 or fewer",
  14: "14 or fewer",
}

export const EMPTY_FILTERS = {
  q: "",
  category: "",
  cuisine: "",
  max: "",
  video: false,
  sort: "relevance",
}

export const filtersFromSearch = search => {
  const params = new URLSearchParams(search)
  const sort = params.get("sort")
  return {
    q: params.get("q") || "",
    category: params.get("category") || "",
    cuisine: params.get("cuisine") || "",
    max: INGREDIENT_LIMITS[params.get("max")] ? params.get("max") : "",
    video: params.get("video") === "1",
    sort: SORTS[sort] ? sort : "relevance",
  }
}

export const filtersToSearch = filters => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (key === "video") value = value ? "1" : ""
    if (value && value !== EMPTY_FILTERS[key]) params.set(key, value)
  })
  const query = params.toString()
  return query ? `?${query}` : ""
}

// 3 = name match, 2 = ingredient, 1 = tag or cuisine, 0 = no match.
const score = (recipe, terms) => {
  let total = 0
  for (const term of terms) {
    const s = recipe.name.toLowerCase().includes(term)
      ? 3
      : recipe.ingredientNames.some(i => i.toLowerCase().includes(term))
      ? 2
      : recipe.tags.some(t => t.toLowerCase().includes(term)) ||
        (recipe.cuisine || "").toLowerCase().includes(term)
      ? 1
      : 0
    if (!s) return 0
    total += s
  }
  return total
}

const byName = (a, b) => a.name.localeCompare(b.name)
const COMPARE = {
  updated: (a, b) =>
    (b.updatedAt || "").localeCompare(a.updatedAt || "") || byName(a, b),
  name: byName,
  ingredients: (a, b) => a.ingredientCount - b.ingredientCount || byName(a, b),
}

export const filterRecipes = (recipes, filters) => {
  const terms = filters.q
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean)
  const results = []
  for (const recipe of recipes) {
    if (filters.category && recipe.category !== filters.category) continue
    if (filters.cuisine && recipe.cuisine !== filters.cuisine) continue
    if (filters.max && recipe.ingredientCount > Number(filters.max)) continue
    if (filters.video && !recipe.youtube) continue
    const relevance = terms.length ? score(recipe, terms) : 0
    if (terms.length && !relevance) continue
    results.push({ recipe, relevance })
  }
  const compare = COMPARE[filters.sort]
  results.sort(
    compare
      ? (a, b) => compare(a.recipe, b.recipe)
      : (a, b) => b.relevance - a.relevance || byName(a.recipe, b.recipe)
  )
  return results.map(r => r.recipe)
}

export const activeFilterCount = filters =>
  ["category", "cuisine", "max", "video"].filter(key => filters[key]).length
