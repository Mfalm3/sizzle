// Estimates a recipe's nutrition from its ingredient amounts and src/_data/nutrition.json
// (USDA SR Legacy, built by build.js from the curated map.js). Runs at site build time in
// gatsby-node, so pages ship the finished numbers.
//
// Never guesses: an ingredient whose food is unknown or ambiguous, or whose amount can't be turned
// into grams ("Pinch", "1 can"), is listed with the reason and left out of the totals.

const NUTRIENTS = [
  "kcal",
  "protein",
  "carbs",
  "fat",
  "fiber",
  "sugar",
  "sodium",
]

const GRAMS = {
  g: 1,
  gr: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilo: 1000,
  kilogram: 1000,
  kilograms: 1000,
  mg: 0.001,
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.6,
  lbs: 453.6,
  pound: 453.6,
  pounds: 453.6,
}
const MILLILITRES = {
  ml: 1,
  millilitre: 1,
  millilitres: 1,
  milliliter: 1,
  milliliters: 1,
  l: 1000,
  litre: 1000,
  litres: 1000,
  liter: 1000,
  liters: 1000,
  tsp: 4.93,
  tsps: 4.93,
  teaspoon: 4.93,
  teaspoons: 4.93,
  tbsp: 14.79,
  tbsps: 14.79,
  tbs: 14.79,
  tbls: 14.79,
  tblsp: 14.79,
  tablespoon: 14.79,
  tablespoons: 14.79,
  cup: 236.6,
  cups: 236.6,
}
// How USDA portion labels name the same volumes.
const PORTION_ML = {
  cup: 236.6,
  tablespoon: 14.79,
  tbsp: 14.79,
  tsp: 4.93,
  teaspoon: 4.93,
  "fl oz": 29.57,
}
const SIZES = ["extra large", "large", "medium", "small", "jumbo"]
// Countable pieces USDA gives a weight for (a "clove" of garlic, a "slice" of bread).
const PIECES = {
  clove: "clove",
  cloves: "clove",
  slice: "slice",
  slices: "slice",
  stalk: "stalk",
  stalks: "stalk",
  fillet: "fillet",
  fillets: "fillet",
  breast: "breast",
  breasts: "breast",
  thigh: "thigh",
  thighs: "thigh",
  piece: null,
  pieces: null,
  whole: null,
}
// Amounts that don't say how much.
const VAGUE = new Set([
  "can",
  "cans",
  "tin",
  "tins",
  "packet",
  "packets",
  "pack",
  "packs",
  "bunch",
  "bunches",
  "handful",
  "handfuls",
  "pinch",
  "pinches",
  "dash",
  "dashes",
  "splash",
  "knob",
  "jar",
  "jars",
  "bottle",
  "bottles",
  "sachet",
  "sachets",
  "part",
  "parts",
  "cube",
  "cubes",
  "sprig",
  "sprigs",
  "drop",
  "drops",
  "pint",
  "pints",
  "box",
  "bag",
])

// First quantity in the text: "1 1/2", "1 ½", "½", "3/4", "2.5", "175" (same forms as src/lib/quantity.js).
const VULGAR = {
  "⅛": 1 / 8,
  "¼": 1 / 4,
  "⅓": 1 / 3,
  "½": 1 / 2,
  "⅔": 2 / 3,
  "¾": 3 / 4,
}
// Mixed number ("1 1/2"), fraction ("3/4"), number with an optional vulgar fraction ("1 ½", "175"),
// or a vulgar fraction alone ("½").
const QUANTITY =
  /^(?:(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)|(\d+(?:\.\d+)?)\s*([⅛¼⅓½⅔¾])?|([⅛¼⅓½⅔¾]))/

const readQuantity = m => {
  if (m[1]) return Number(m[1]) + Number(m[2]) / Number(m[3])
  if (m[4]) return Number(m[4]) / Number(m[5])
  if (m[6]) return Number(m[6]) + (m[7] ? VULGAR[m[7]] : 0)
  return VULGAR[m[8]]
}

/** "3 cloves chopped" -> { amount: 3, unit: "cloves", rest: "chopped" }; null when there's no amount. */
const parseMeasure = text => {
  if (!text) return null
  let s = String(text).toLowerCase().trim()
  // "Juice of 1" / "Zest of 2"
  const derived = s.match(/^(juice|zest) of (.*)$/)
  const unitOverride = derived && derived[1]
  if (derived) s = derived[2]
  const start = s.search(/[\d⅛¼⅓½⅔¾]/)
  if (start === -1) return null
  const m = s.slice(start).match(QUANTITY)
  const amount = readQuantity(m)
  if (!amount) return null
  const after = s.slice(start + m[0].length).trim()
  if (unitOverride) return { amount, unit: unitOverride, rest: after }
  const fl = after.match(/^fl\.?\s*oz\b/)
  if (fl)
    return { amount, unit: "fl oz", rest: after.slice(fl[0].length).trim() }
  const [, unit = "", rest = ""] = after.match(/^([a-z]+)?\s*(.*)$/) || []
  return { amount, unit, rest: rest.trim() }
}

const portionMl = label => {
  const first = label
    .toLowerCase()
    .match(/^(fl oz|cup|tablespoon|tbsp|tsp|teaspoon)\b/)
  return first ? PORTION_ML[first[1]] : null
}

// Grams per millilitre from the food's own volume portions, preferring plain ones ("cup" over
// "cup, chopped", which packs differently).
const density = food => {
  const volume = food.portions.filter(p => portionMl(p.label))
  const plain =
    volume.find(p =>
      /^(cup|tablespoon|tbsp|tsp|teaspoon|fl oz)$/i.test(p.label)
    ) || volume[0]
  return plain ? plain.grams / plain.amount / portionMl(plain.label) : null
}

// Weight of one item: a requested size, a named piece, or else the usual whole-item portion.
const itemWeight = (food, want) => {
  const usable = food.portions.filter(
    p => !portionMl(p.label) && !/serving|^oz|^lb|^g\b|yield/i.test(p.label)
  )
  const pick = pattern => usable.find(p => pattern.test(p.label))
  const portion =
    (want && pick(new RegExp(`\\b${want}\\b`, "i"))) ||
    pick(/\bmedium\b/i) ||
    pick(/\b(whole|fruit|large|item|each)\b/i) ||
    usable[0]
  return portion ? portion.grams / portion.amount : null
}

const toGrams = (parsed, food) => {
  const { amount, unit, rest } = parsed
  if (GRAMS[unit]) return { grams: amount * GRAMS[unit] }
  if (MILLILITRES[unit] || unit === "fl oz") {
    const perMl = density(food)
    if (!perMl) return { reason: "No USDA weight for this volume of this food" }
    return { grams: amount * (MILLILITRES[unit] || 29.57) * perMl }
  }
  if (unit === "juice" || unit === "zest") {
    const yieldPortion = food.portions.find(p => /yield/i.test(p.label))
    if (yieldPortion)
      return { grams: (amount * yieldPortion.grams) / yieldPortion.amount }
    return { reason: "No USDA weight for the juice of one fruit" }
  }
  if (VAGUE.has(unit))
    return { reason: `“${unit}” is not specific enough to weigh` }
  const size = SIZES.find(s => `${unit} ${rest}`.startsWith(s))
  const piece = unit in PIECES ? PIECES[unit] : null
  const each = itemWeight(food, size || piece)
  if (!each) return { reason: "No USDA weight for one of these" }
  // "5 boneless" chicken is pieces, not five whole birds: counts of heavy items are ambiguous.
  if (each > 500 && amount > 2)
    return { reason: "The amount is unclear (whole items or pieces?)" }
  return { grams: amount * each }
}

const round = (value, places = 1) =>
  Math.round(value * 10 ** places) / 10 ** places

/** One recipe ingredient -> { name, measure, grams, fdcId, approx, nutrients } or { name, measure, reason }. */
const ingredientNutrition = ({ name, measure }, data) => {
  const base = { name, measure: measure || null }
  const mapping = data.ingredients[String(name).toLowerCase().trim()]
  if (!mapping)
    return { ...base, reason: "No nutrition data for this ingredient yet" }
  if (!mapping.fdcId) return { ...base, reason: mapping.reason }
  const food = data.foods[mapping.fdcId]
  const parsed = parseMeasure(measure)
  if (!parsed) return { ...base, reason: "The recipe doesn't give an amount" }
  const result = toGrams(parsed, food)
  if (result.reason) return { ...base, reason: result.reason }
  const grams = round(result.grams)
  const nutrients = Object.fromEntries(
    NUTRIENTS.map(k => [
      k,
      food.per100g[k] === null
        ? null
        : round((food.per100g[k] * result.grams) / 100, 2),
    ])
  )
  return {
    ...base,
    grams,
    fdcId: mapping.fdcId,
    food: food.description,
    approx: Boolean(mapping.approx),
    nutrients,
  }
}

/** A whole recipe: totals of the counted ingredients, which ones weren't counted and why. */
const recipeNutrition = (ingredients, data) => {
  const items = ingredients.map(i => ingredientNutrition(i, data))
  const counted = items.filter(i => i.nutrients)
  const totals = Object.fromEntries(
    NUTRIENTS.map(k => [
      k,
      round(counted.reduce((sum, i) => sum + (i.nutrients[k] || 0), 0)),
    ])
  )
  // A nutrient USDA doesn't report for a counted food makes that total a minimum, not a full figure.
  const partial = NUTRIENTS.filter(k =>
    counted.some(i => i.nutrients[k] === null)
  )
  return {
    totals,
    partial,
    counted: counted.length,
    total: items.length,
    items,
  }
}

module.exports = {
  NUTRIENTS,
  parseMeasure,
  ingredientNutrition,
  recipeNutrition,
}
