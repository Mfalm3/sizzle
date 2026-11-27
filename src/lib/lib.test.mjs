import { test } from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"
import { scaleMeasure, parseQuantity, formatQuantity } from "./quantity.js"
import {
  findDurations,
  formatClock,
  parseStoredTimers,
  stepHref,
} from "./timers.js"
import {
  filterRecipes,
  filtersFromSearch,
  filtersToSearch,
  EMPTY_FILTERS,
} from "./filterRecipes.js"

const { splitMethod } = createRequire(import.meta.url)("../../utils/recipes.js")

test("parses quantities", () => {
  assert.equal(parseQuantity("1 1/2"), 1.5)
  assert.equal(parseQuantity("1 ½"), 1.5)
  assert.equal(parseQuantity("¾"), 0.75)
  assert.equal(parseQuantity("2.5"), 2.5)
})

test("formats quantities as kitchen fractions", () => {
  assert.equal(formatQuantity(0.5), "½")
  assert.equal(formatQuantity(1.5), "1½")
  assert.equal(formatQuantity(2), "2")
  assert.equal(formatQuantity(0.3333), "⅓")
  assert.equal(formatQuantity(12.4), "12")
  assert.equal(formatQuantity(1.99), "2")
})

test("scales measures", () => {
  assert.equal(scaleMeasure("1 1/2 cups", 2), "3 cups")
  assert.equal(scaleMeasure("175g/6oz", 2), "350g/12oz")
  assert.equal(scaleMeasure("1 tsp", 0.5), "½ tsp")
  assert.equal(scaleMeasure("Juice of 1", 3), "Juice of 3")
  assert.equal(scaleMeasure("Pinch", 2), "Pinch")
  assert.equal(scaleMeasure("2 tbsp", 1), "2 tbsp")
  assert.equal(scaleMeasure(null, 2), null)
})

test("finds durations in method steps", () => {
  assert.deepEqual(
    findDurations("Fry until golden, about 4-5 mins. Bake for 1 hour.").map(
      d => d.seconds
    ),
    [240, 3600]
  )
  assert.deepEqual(findDurations("Season to taste."), [])
  assert.equal(formatClock(3725), "1:02:05")
  assert.equal(formatClock(65), "1:05")
})

test("splits instructions into steps without the source's numbering", () => {
  assert.deepEqual(splitMethod("step 1\r\nChop.\r\n\r\nstep 2\r\nFry."), [
    { title: null, steps: ["Chop.", "Fry."] },
  ])
  assert.deepEqual(
    splitMethod("1. Chop.\n2) Fry.\nSTEP 3 - Serve.\n4\n▢ Rest."),
    [{ title: null, steps: ["Chop.", "Fry.", "Serve.", "Rest."] }]
  )
})

test("groups methods under their section titles", () => {
  assert.deepEqual(
    splitMethod(
      "Equipment\n6QT Pressure cooker\nInstructions\nRinse goat.\nMarinate the beef:\nMix soy.\nPro Tips:\nRest it."
    ),
    [
      { title: null, steps: ["Rinse goat."] },
      { title: "Marinate the beef", steps: ["Mix soy."] },
      { title: "Pro Tips", steps: ["Rest it."] },
    ]
  )
})

const recipes = [
  {
    name: "Beef Stew",
    category: "Beef",
    cuisine: "Irish",
    tags: ["Stew"],
    ingredientNames: ["Beef", "Carrots"],
    ingredientCount: 9,
    youtube: "y",
    updatedAt: "2025-01-01",
  },
  {
    name: "Carrot Cake",
    category: "Dessert",
    cuisine: "British",
    tags: [],
    ingredientNames: ["Carrots", "Flour"],
    ingredientCount: 6,
    youtube: null,
    updatedAt: null,
  },
  {
    name: "Lamb Tagine",
    category: "Lamb",
    cuisine: "Moroccan",
    tags: [],
    ingredientNames: ["Lamb", "Carrots"],
    ingredientCount: 12,
    youtube: "y",
    updatedAt: "2026-01-01",
  },
]

test("filters and ranks recipes", () => {
  const names = filters =>
    filterRecipes(recipes, { ...EMPTY_FILTERS, ...filters }).map(r => r.name)
  assert.deepEqual(names({ q: "carrot" }), [
    "Carrot Cake",
    "Beef Stew",
    "Lamb Tagine",
  ])
  assert.deepEqual(names({ q: "carrot lamb" }), ["Lamb Tagine"])
  assert.deepEqual(names({ max: "10" }), ["Beef Stew", "Carrot Cake"])
  assert.deepEqual(names({ video: true, sort: "updated" }), [
    "Lamb Tagine",
    "Beef Stew",
  ])
  assert.deepEqual(names({ category: "Dessert" }), ["Carrot Cake"])
})

test("round-trips filters through the URL", () => {
  const filters = { ...EMPTY_FILTERS, q: "rice", cuisine: "Thai", video: true }
  assert.deepEqual(filtersFromSearch(filtersToSearch(filters)), filters)
  assert.equal(filtersToSearch(EMPTY_FILTERS), "")
  assert.equal(filtersFromSearch("?max=999&sort=bogus").max, "")
})

const timer = {
  id: "1-beef-2",
  label: "10 min",
  step: 2,
  seconds: 600,
  endsAt: 1700000000000,
  done: false,
  recipe: { name: "Beef Stew", slug: "beef-stew" },
  stepText: "Simmer for 10 minutes.",
  section: "Make the sauce",
}

test("restores well-formed timers from storage and drops the rest", () => {
  assert.deepEqual(parseStoredTimers(JSON.stringify([timer])), [timer])
  assert.deepEqual(parseStoredTimers(null), [])
  assert.deepEqual(parseStoredTimers("not json"), [])
  assert.deepEqual(parseStoredTimers('{"a":1}'), [])
  const bad = [
    { ...timer, endsAt: "soon" },
    { ...timer, step: 0 },
    { ...timer, seconds: -5 },
    { ...timer, recipe: { name: "X", slug: "../../evil" } },
    { ...timer, recipe: null },
    null,
  ]
  assert.deepEqual(parseStoredTimers(JSON.stringify([...bad, timer])), [timer])
})

test("links a timer to its step on the recipe page", () => {
  assert.equal(stepHref(timer), "/recipes/beef-stew/#step-2")
})
