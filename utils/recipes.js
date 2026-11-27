// Turns raw TheMealDB records into the shapes the site's GraphQL types expose.
const { kebabCase, startCase } = require("lodash")

const TAG_FIXES = { Desert: "Dessert" }

// "1.", "2)", "step 3 -", "*" and "▢" prefixes are numbering the UI already adds.
const STEP_PREFIX = /^(step\s*\d+\s*[-:.)]?|\d+[.):]|[-•*▢])\s*/i
// Labels for the whole method: dropped, since the page already says "Method".
const METHOD_LABEL =
  /^(instructions|directions|method|preparation|steps?|cooking instructions)$/i
// Equipment and ingredient lists inside the method duplicate the ingredients panel.
const LIST_LABEL = /^(equipment|ingredients?|you will need\b.*)$/i

const asTitle = line => {
  const title = line.replace(/:$/, "").trim()
  return title === title.toUpperCase()
    ? title.charAt(0) + title.slice(1).toLowerCase()
    : title
}

const isHeading = line => {
  if (line.length > 60) return false
  const bare = line.replace(/:$/, "").trim()
  const shouting =
    bare === bare.toUpperCase() && /\p{L}{3}/u.test(bare) && bare.length <= 40
  return (
    line.endsWith(":") ||
    shouting ||
    METHOD_LABEL.test(bare) ||
    LIST_LABEL.test(bare)
  )
}

// Splits free-text instructions into titled groups of steps, e.g. "Marinate the beef:" sections.
const splitMethod = text => {
  const groups = [{ title: null, steps: [], skip: false }]
  for (const raw of (text || "").split(/\r?\n/)) {
    const line = raw.trim().replace(STEP_PREFIX, "").trim()
    if (!/\p{L}/u.test(line)) continue // bare step numbers, checkbox glyphs
    if (isHeading(line)) {
      const bare = line.replace(/:$/, "").trim()
      const title = METHOD_LABEL.test(bare) ? null : asTitle(line)
      groups.push({
        title: LIST_LABEL.test(bare) ? null : title,
        steps: [],
        skip: LIST_LABEL.test(bare),
      })
      continue
    }
    groups[groups.length - 1].steps.push(line)
  }
  const kept = groups.filter(g => g.steps.length && !g.skip)
  // If everything sat under an "Equipment" heading, showing it beats showing nothing.
  return (kept.length ? kept : groups.filter(g => g.steps.length)).map(
    ({ title, steps }) => ({ title, steps })
  )
}

const listIngredients = meal => {
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] || "").trim()
    if (!name) continue
    const measure = (meal[`strMeasure${i}`] || "").replace(/\s+/g, " ").trim()
    ingredients.push({ name, measure: measure || null })
  }
  return ingredients
}

const parseTags = raw => [
  ...new Set(
    (raw || "")
      .split(",")
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => startCase(TAG_FIXES[t] || t))
  ),
]

// areaByCountry maps "Jamaica" -> "Jamaican" from TheMealDB's area list.
const normalizeMeal = (meal, areaByCountry) => {
  const ingredients = listIngredients(meal)
  const method = splitMethod(meal.strInstructions)
  return {
    recipeId: meal.idMeal,
    slug: kebabCase(meal.strMeal),
    name: meal.strMeal.trim(),
    category: meal.strCategory,
    categorySlug: kebabCase(meal.strCategory),
    cuisine:
      areaByCountry[meal.strCountry] || meal.strArea || meal.strCountry || null,
    tags: parseTags(meal.strTags),
    image: meal.strMealThumb,
    method,
    ingredients,
    ingredientNames: ingredients.map(i => i.name),
    ingredientCount: ingredients.length,
    stepCount: method.reduce((n, g) => n + g.steps.length, 0),
    youtube: meal.strYoutube || null,
    source: meal.strSource || null,
    updatedAt: meal.dateModified
      ? `${meal.dateModified.replace(" ", "T")}Z`
      : null,
  }
}

const normalizeCategory = (category, recipeCount) => ({
  name: category.strCategory,
  slug: kebabCase(category.strCategory),
  image: category.strCategoryThumb,
  // Descriptions are copied from Wikipedia and still carry "[1]" citation markers.
  description: category.strCategoryDescription.replace(/\[\d+\]/g, "").trim(),
  recipeCount,
})

module.exports = { normalizeMeal, normalizeCategory, splitMethod }
