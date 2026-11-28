import { test } from "node:test"
import assert from "node:assert/strict"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const {
  parseMeasure,
  ingredientNutrition,
  recipeNutrition,
} = require("../../utils/nutrition/calc.js")
const data = require("../_data/nutrition.json")

const grams = (name, measure) =>
  ingredientNutrition({ name, measure }, data).grams
const reason = (name, measure) =>
  ingredientNutrition({ name, measure }, data).reason

test("reads amounts and units from free-text measures", () => {
  assert.deepEqual(parseMeasure("175g/6oz"), {
    amount: 175,
    unit: "g",
    rest: "/6oz",
  })
  assert.deepEqual(parseMeasure("1 1/2 cups"), {
    amount: 1.5,
    unit: "cups",
    rest: "",
  })
  assert.deepEqual(parseMeasure("1 ½ tbsp"), {
    amount: 1.5,
    unit: "tbsp",
    rest: "",
  })
  assert.deepEqual(parseMeasure("3 cloves chopped"), {
    amount: 3,
    unit: "cloves",
    rest: "chopped",
  })
  assert.deepEqual(parseMeasure("Juice of 1"), {
    amount: 1,
    unit: "juice",
    rest: "",
  })
  assert.deepEqual(parseMeasure("3/4 cup"), {
    amount: 0.75,
    unit: "cup",
    rest: "",
  })
  assert.deepEqual(parseMeasure("½ tsp"), {
    amount: 0.5,
    unit: "tsp",
    rest: "",
  })
  assert.deepEqual(parseMeasure("1½ cups"), {
    amount: 1.5,
    unit: "cups",
    rest: "",
  })
  assert.deepEqual(parseMeasure("2.5 kg"), {
    amount: 2.5,
    unit: "kg",
    rest: "",
  })
  assert.deepEqual(parseMeasure("Juice of 1/2"), {
    amount: 0.5,
    unit: "juice",
    rest: "",
  })
  assert.equal(parseMeasure("Pinch"), null)
  assert.equal(parseMeasure("To taste"), null)
  assert.equal(parseMeasure(null), null)
})

test("converts mass units directly", () => {
  assert.equal(grams("onion", "175g/6oz"), 175)
  assert.equal(grams("minced beef", "1 lb"), 453.6)
  assert.equal(grams("butter", "4 oz"), 113.4)
  assert.equal(grams("sugar", "1kg"), 1000)
})

test("converts volumes with the food's own USDA portion weights", () => {
  assert.equal(grams("olive oil", "1 tbsp"), 13.5)
  assert.equal(grams("olive oil", "2 tablespoons"), 27)
  assert.equal(grams("olive oil", "1 tsp"), 4.5)
  // 1 cup of whole milk weighs 244 g, so 50 ml is about 51.6 g
  assert.equal(Math.round(grams("milk", "50 ml") * 10) / 10, 51.6)
})

test("converts counts and sizes with USDA item weights", () => {
  assert.equal(grams("eggs", "2 large"), 100)
  assert.equal(grams("eggs", "3"), 132) // no size given: medium, 44 g each
  assert.equal(grams("garlic", "3 cloves chopped"), 9)
  assert.equal(grams("onion", "1 small finely diced"), 70)
  assert.equal(grams("onion", "2 chopped"), 220)
  assert.equal(grams("lemon juice", "Juice of 1"), 48)
})

test("explains what it can't count instead of guessing", () => {
  assert.match(reason("salt", "Pinch"), /amount/i)
  assert.match(reason("coconut milk", "1 can"), /not specific/i)
  assert.match(reason("pepper", "1 tsp"), /black pepper and bell peppers/)
  assert.match(reason("unicorn dust", "1 tsp"), /no nutrition data/i)
  assert.match(reason("salt", null), /amount/i)
  assert.match(reason("chicken", "5 boneless"), /unclear/i)
})

test("totals a recipe and reports coverage and gaps", () => {
  const n = recipeNutrition(
    [
      { name: "Olive Oil", measure: "1 tbsp" },
      { name: "Eggs", measure: "2 large" },
      { name: "Salt", measure: "Pinch" },
      { name: "Beef", measure: "500g" },
    ],
    data
  )
  assert.equal(n.total, 4)
  assert.equal(n.counted, 2)
  // 13.5 g olive oil (884 kcal/100 g) + 100 g egg (143 kcal/100 g)
  assert.equal(Math.round(n.totals.kcal), Math.round(13.5 * 8.84 + 143))
  assert.deepEqual(
    n.items.filter(i => i.reason).map(i => i.name),
    ["Salt", "Beef"]
  )
  assert.deepEqual(n.partial, [])
})

test("flags nutrients USDA doesn't report for a counted food", () => {
  const n = recipeNutrition([{ name: "Shrimp", measure: "200g" }], data)
  assert.deepEqual(n.partial, ["fiber", "sugar"])
})
