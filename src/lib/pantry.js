// "What can I cook?" matching. Deterministic and explainable on purpose: every recommendation
// can say exactly which of its ingredients you have, which you're missing, and why.
//
// Ingredient names are compared as normalized word sets. A whole ingredient satisfies its forms
// and parts ("tomatoes" covers "chopped tomatoes", "chicken" covers "chicken breast"), but never
// a processed product ("tomato puree") or a different food that shares a word ("coconut milk").

// Words that describe preparation or size, not what the food is.
const DESCRIPTORS = new Set([
  "chopped",
  "diced",
  "sliced",
  "minced",
  "grated",
  "shredded",
  "crushed",
  "fresh",
  "freshly",
  "large",
  "small",
  "medium",
  "free",
  "range",
  "organic",
  "whole",
  "beaten",
  "peeled",
  "cubed",
  "finely",
  "roughly",
  "thinly",
  "raw",
  "tinned",
  "canned",
  "extra",
  "virgin",
  "all",
  "purpose",
  "plain",
  "ground",
  "boiling",
  "cold",
  "warm",
  "unsalted",
  "salted",
  "sea",
  "kosher",
  "ripe",
  "boneless",
  "skinless",
  "cube",
  "frozen",
  "lean",
  "softened",
  "melted",
  "toasted",
  "cooked",
])
const STOPWORDS = new Set([
  "of",
  "and",
  "the",
  "a",
  "an",
  "to",
  "for",
  "with",
  "or",
  "in",
])

// A pantry item never satisfies an ingredient whose extra words are any of these, in either
// direction: "tomato" is not "tomato puree", and "tomato puree" is not "tomato".
const PROCESSED = new Set([
  "puree",
  "sauce",
  "ketchup",
  "paste",
  "powder",
  "stock",
  "broth",
  "bouillon",
  "granule",
  "flake",
  "dried",
  "sun",
  "extract",
  "essence",
  "jam",
  "jelly",
  "marmalade",
  "syrup",
  "soup",
  "salt",
  "vinegar",
  "oil",
  "flour",
  "noodle",
  "wrapper",
  "roll",
  "wash",
  "pickled",
  "smoked",
  "concentrate",
  "cordial",
  "liqueur",
  "wine",
  "milk",
  "cream",
  "butter",
])
// Words that make a different food out of a familiar one: "coconut milk", "cream cheese",
// "spring onion", "sweet potato".
const DISTINCT = new Set([
  "coconut",
  "almond",
  "soy",
  "soya",
  "oat",
  "rice",
  "cashew",
  "peanut",
  "hazelnut",
  "cream",
  "cottage",
  "condensed",
  "evaporated",
  "spring",
  "sweet",
])
// Parts you can take from the whole ingredient: having "chicken" covers "chicken breast",
// having "lemon" covers "lemon juice".
const PART_OF_WHOLE = new Set([
  "breast",
  "thigh",
  "leg",
  "wing",
  "drumstick",
  "fillet",
  "clove",
  "leaf",
  "stalk",
  "sprig",
  "yolk",
  "white",
  "juice",
  "zest",
  "rind",
  "wedge",
  "segment",
])
// Parts that still count as the whole: "chicken breast" covers a recipe's "chicken", but
// "lemon juice" doesn't cover "lemon" and "egg yolk" doesn't cover "egg".
const PART_FOR_WHOLE = new Set([
  "breast",
  "thigh",
  "leg",
  "wing",
  "drumstick",
  "fillet",
  "clove",
  "sprig",
])

const WORD_ALIASES = {
  cilantro: "coriander",
  prawn: "shrimp",
  eggplant: "aubergine",
  zucchini: "courgette",
  scallion: "spring onion",
}
const PHRASE_ALIASES = { "egg plant": "aubergine", "garbanzo bean": "chickpea" }

const SINGULAR_EXCEPTIONS = {
  leaves: "leaf",
  loaves: "loaf",
  halves: "half",
  chillies: "chilli",
  molasses: "molasses",
  hummus: "hummus",
  couscous: "couscous",
  asparagus: "asparagus",
  octopus: "octopus",
  citrus: "citrus",
}

const singular = word => {
  if (SINGULAR_EXCEPTIONS[word]) return SINGULAR_EXCEPTIONS[word]
  if (word.length <= 3) return word
  if (word.endsWith("ies")) return word.slice(0, -3) + "y"
  if (word.endsWith("oes")) return word.slice(0, -2)
  if (/(sses|xes|zes|ches|shes)$/.test(word)) return word.slice(0, -2)
  if (/(ss|us|is)$/.test(word)) return word
  if (word.endsWith("s")) return word.slice(0, -1)
  return word
}

// "Free-range Egg, Beaten" -> { key: "egg", words: ["egg"], head: "egg" }
export const normalizeIngredient = name => {
  const cleaned = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split(",")[0]
    .replace(/&/g, " and ")
    .replace(/[^a-z\s]/g, " ")
  let key = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map(singular)
    .filter(w => !STOPWORDS.has(w) && !DESCRIPTORS.has(w))
    .map(w => WORD_ALIASES[w] || w)
    .join(" ")
  key = PHRASE_ALIASES[key] || key
  const words = key ? key.split(" ") : []
  return { key, words, head: words[words.length - 1] || "" }
}

const extraWords = (from, to) => to.words.filter(w => !from.words.includes(w))

// Does having `have` mean the recipe's `need` is covered? Both are normalized ingredients.
export const ingredientMatches = (have, need) => {
  if (!have.key || !need.key) return false
  if (have.key === need.key) return true

  // The recipe asks for something more specific than what you have.
  if (have.words.every(w => need.words.includes(w))) {
    const extra = extraWords(have, need)
    if (extra.some(w => PROCESSED.has(w) || DISTINCT.has(w))) return false
    return have.head === need.head || extra.every(w => PART_OF_WHOLE.has(w))
  }
  // What you have is more specific than what the recipe asks for.
  if (need.words.every(w => have.words.includes(w))) {
    const extra = extraWords(need, have)
    if (extra.some(w => PROCESSED.has(w) || DISTINCT.has(w))) return false
    return have.head === need.head || extra.every(w => PART_FOR_WHOLE.has(w))
  }
  return false
}

// Pantry basics most kitchens have; matched exactly so "red pepper" or "onion salt" don't count.
const STAPLES = new Set([
  "salt",
  "pepper",
  "black pepper",
  "white pepper",
  "water",
  "oil",
  "olive oil",
  "vegetable oil",
  "sunflower oil",
  "rapeseed oil",
  "canola oil",
  "cooking oil",
])
export const BASICS_LABEL = "salt, pepper, oil and water"
export const isStaple = ingredient => STAPLES.has(ingredient.key)

// Diet from ingredient names alone. Conservative: a word like "chicken" anywhere (even in
// "chicken stock") rules out vegetarian. It is a guide, not a guarantee, and the UI says so.
const MEAT = new Set([
  "beef",
  "pork",
  "lamb",
  "mutton",
  "goat",
  "veal",
  "venison",
  "chicken",
  "turkey",
  "duck",
  "goose",
  "bacon",
  "ham",
  "gammon",
  "sausage",
  "chorizo",
  "salami",
  "pepperoni",
  "prosciutto",
  "pancetta",
  "mince",
  "meat",
  "steak",
  "brisket",
  "oxtail",
  "liver",
  "kidney",
  "gelatin",
  "gelatine",
  "lard",
  "suet",
  "anchovy",
  "fish",
  "salmon",
  "tuna",
  "cod",
  "haddock",
  "mackerel",
  "sardine",
  "trout",
  "tilapia",
  "shrimp",
  "crab",
  "lobster",
  "mussel",
  "clam",
  "oyster",
  "scallop",
  "squid",
  "calamari",
  "octopus",
  "worcestershire",
  "bonito",
  "rabbit",
  "pheasant",
  "quail",
  "seafood",
  "codfish",
  "barramundi",
  "bass",
  "herring",
  "halibut",
  "snapper",
  "swordfish",
  "sole",
  "plaice",
  "pollock",
  "monkfish",
  "kipper",
  "whitebait",
  "eel",
  "caviar",
  "roe",
  "conch",
  "crawfish",
  "crayfish",
  "langoustine",
  "cockle",
  "whelk",
  "jamon",
  "mortadella",
  "bresaola",
])
// A bean is never meat, whatever it's called ("kidney beans", "butter beans").
const NEVER_MEAT_HEADS = new Set(["bean"])
const MEAT_EXCEPTIONS = new Set(["beef tomato"])
const ANIMAL = new Set([
  "egg",
  "yolk",
  "honey",
  "milk",
  "butter",
  "cheese",
  "cream",
  "yogurt",
  "yoghurt",
  "ghee",
  "buttermilk",
  "custard",
  "whey",
  "mayonnaise",
  "mozzarella",
  "parmesan",
  "cheddar",
  "ricotta",
  "feta",
  "mascarpone",
  "paneer",
  "halloumi",
  "brie",
  "stilton",
  "gouda",
  "creme",
  "fraiche",
  "quark",
  "kefir",
])
const DAIRY_HEADS = new Set([
  "cheese",
  "milk",
  "cream",
  "yogurt",
  "yoghurt",
  "butter",
  "egg",
])
const PLANT = new Set([
  "coconut",
  "almond",
  "soy",
  "soya",
  "oat",
  "rice",
  "cashew",
  "peanut",
  "hazelnut",
  "vegan",
  "plant",
  "flax",
  "chia",
])
const NOT_ANIMAL_HEADS = new Set(["bean", "tartar", "aubergine"])

const isMeat = i =>
  !MEAT_EXCEPTIONS.has(i.key) &&
  !DAIRY_HEADS.has(i.head) &&
  !NEVER_MEAT_HEADS.has(i.head) &&
  i.words.some(w => MEAT.has(w))
const isAnimal = i =>
  !NOT_ANIMAL_HEADS.has(i.head) &&
  !i.words.some(w => PLANT.has(w)) &&
  i.words.some(w => ANIMAL.has(w))

export const dietOf = ingredients => {
  const vegetarian = !ingredients.some(isMeat)
  return { vegetarian, vegan: vegetarian && !ingredients.some(isAnimal) }
}

export const SORTS = {
  match: "Best ingredient match",
  missing: "Fewest missing",
  steps: "Shortest method",
  ingredients: "Fewest ingredients",
}
export const DIETS = { vegetarian: "Vegetarian", vegan: "Vegan" }

const byName = (a, b) => a.recipe.name.localeCompare(b.recipe.name)
const COMPARE = {
  match: (a, b) =>
    b.percent - a.percent ||
    b.matched.length - a.matched.length ||
    a.missing.length - b.missing.length ||
    byName(a, b),
  missing: (a, b) =>
    a.missing.length - b.missing.length ||
    b.percent - a.percent ||
    byName(a, b),
  steps: (a, b) =>
    a.recipe.stepCount - b.recipe.stepCount ||
    b.percent - a.percent ||
    byName(a, b),
  ingredients: (a, b) =>
    a.recipe.ingredientCount - b.recipe.ingredientCount ||
    b.percent - a.percent ||
    byName(a, b),
}

// Normalizing is cheap, but the page re-runs matching on every keystroke; cache per recipe.
const normalizedCache = new WeakMap()
const ingredientsOf = recipe => {
  if (!normalizedCache.has(recipe)) {
    const seen = new Set()
    const list = []
    for (const name of recipe.ingredientNames) {
      const n = normalizeIngredient(name)
      if (!n.key || seen.has(n.key)) continue // "Dry sherry" listed twice counts once
      seen.add(n.key)
      list.push({ name, n })
    }
    normalizedCache.set(recipe, list)
  }
  return normalizedCache.get(recipe)
}

// Excluding is broader than matching, to stay on the safe side: leaving out "milk" also leaves
// out "coconut milk" and "milk chocolate".
const excludes = (excluded, ingredient) =>
  excluded.words.every(w => ingredient.words.includes(w))

/**
 * @param recipes   [{ recipeId, name, ingredientNames, stepCount, ingredientCount, ... }]
 * @param options   have: what you have; exclude: ingredients to leave out; diet: "", "vegetarian"
 *                  or "vegan"; assumeBasics: treat salt, pepper, oil and water as available
 * @returns [{ recipe, matched, missing, basics, needed, percent }] — names as the recipe writes them
 */
export const recommend = (
  recipes,
  {
    have = [],
    exclude = [],
    diet = "",
    assumeBasics = true,
    sort = "match",
  } = {}
) => {
  const haveN = have.map(normalizeIngredient).filter(n => n.key)
  if (!haveN.length) return []
  const excludeN = exclude.map(normalizeIngredient).filter(n => n.key)

  const results = []
  for (const recipe of recipes) {
    const ingredients = ingredientsOf(recipe)
    if (excludeN.some(x => ingredients.some(i => excludes(x, i.n)))) continue
    if (diet) {
      const d = dietOf(ingredients.map(i => i.n))
      if (!d[diet]) continue
    }

    const matched = []
    const missing = []
    const basics = []
    let realMatch = false
    for (const { name, n } of ingredients) {
      if (assumeBasics && isStaple(n)) basics.push(name)
      else if (haveN.some(h => ingredientMatches(h, n))) {
        matched.push(name)
        if (!isStaple(n)) realMatch = true
      } else missing.push(name)
    }
    const needed = matched.length + missing.length
    if (!realMatch || !needed) continue
    results.push({
      recipe,
      matched,
      missing,
      basics,
      needed,
      percent: Math.round((matched.length / needed) * 100),
    })
  }
  return results.sort(COMPARE[sort] || COMPARE.match)
}

// "Tomatoes, onions\n- eggs\n• spinach" -> ["Tomatoes", "onions", "eggs", "spinach"]
export const parsePantryList = text =>
  String(text || "")
    .split(/[\n,;]+/)
    .map(s => s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/, "").trim())
    .filter(Boolean)

const list = value =>
  value
    ? value
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : []

export const pantryFromSearch = search => {
  const params = new URLSearchParams(search)
  const diet = params.get("diet")
  const sort = params.get("sort")
  return {
    have: list(params.get("have")),
    exclude: list(params.get("not")),
    diet: DIETS[diet] ? diet : "",
    assumeBasics: params.get("basics") !== "0",
    sort: SORTS[sort] ? sort : "match",
  }
}

export const pantryToSearch = ({ have, exclude, diet, assumeBasics, sort }) => {
  const params = new URLSearchParams()
  if (have.length) params.set("have", have.join(","))
  if (exclude.length) params.set("not", exclude.join(","))
  if (diet) params.set("diet", diet)
  if (!assumeBasics) params.set("basics", "0")
  if (sort && sort !== "match") params.set("sort", sort)
  const query = params.toString().replace(/%2C/g, ",")
  return query ? `?${query}` : ""
}
