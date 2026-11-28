#!/usr/bin/env node
// Regenerates src/_data/nutrition.json from the USDA SR Legacy dataset (public domain).
// Only needed when utils/nutrition/map.js changes; the site build reads the generated file.
//
//   curl -LO https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
//   unzip FoodData_Central_sr_legacy_food_csv_2018-04.zip -d usda
//   npm run nutrition:build -- usda/FoodData_Central_sr_legacy_food_csv_2018-04
const fs = require("fs")
const path = require("path")
const readCsv = require("./csv")
const map = require("./map")

const SOURCE = {
  name: "USDA FoodData Central, SR Legacy (April 2018)",
  url: "https://fdc.nal.usda.gov/",
}
// SR Legacy nutrient ids. Sodium is in mg, everything else here in g except energy (kcal).
const NUTRIENTS = {
  kcal: "1008",
  protein: "1003",
  carbs: "1005",
  fat: "1004",
  fiber: "1079",
  sugar: "2000",
  sodium: "1093",
}

const dir = process.argv[2]
if (!dir || !fs.existsSync(path.join(dir, "food.csv"))) {
  console.error(
    "Usage: npm run nutrition:build -- <unzipped SR Legacy CSV folder>  (see the comment at the top of this file)"
  )
  process.exit(1)
}
const csv = name => readCsv(path.join(dir, name))

const idByDescription = new Map(
  csv("food.csv").map(f => [f.description, f.fdc_id])
)

// Resolve the curated map; every description must exist exactly, and every name once.
const ingredients = {}
const wanted = new Map()
for (const entry of map) {
  const id = entry.description && idByDescription.get(entry.description)
  if (entry.description && !id)
    throw new Error(`Not an SR Legacy food: "${entry.description}"`)
  for (const name of entry.names) {
    if (ingredients[name])
      throw new Error(`"${name}" is mapped twice in utils/nutrition/map.js`)
    if (!id) ingredients[name] = { reason: entry.reason }
    else {
      ingredients[name] = entry.approx
        ? { fdcId: id, approx: true }
        : { fdcId: id }
      wanted.set(id, entry.description)
    }
  }
}

const foods = {}
for (const [id, description] of wanted) {
  foods[id] = {
    description,
    per100g: Object.fromEntries(Object.keys(NUTRIENTS).map(k => [k, null])),
    portions: [],
  }
}
const nutrientKey = Object.fromEntries(
  Object.entries(NUTRIENTS).map(([k, id]) => [id, k])
)
for (const row of csv("food_nutrient.csv")) {
  const key = nutrientKey[row.nutrient_id]
  if (key && foods[row.fdc_id])
    foods[row.fdc_id].per100g[key] = Number(row.amount)
}
for (const row of csv("food_portion.csv")) {
  const grams = Number(row.gram_weight)
  if (!foods[row.fdc_id] || !grams) continue
  foods[row.fdc_id].portions.push({
    amount: Number(row.amount) || 1,
    label: row.modifier.trim(),
    grams,
  })
}

const out = path.join(__dirname, "../../src/_data/nutrition.json")
fs.writeFileSync(
  out,
  JSON.stringify({ source: SOURCE, ingredients, foods }, null, 2) + "\n"
)
console.log(
  `Wrote ${path.relative(process.cwd(), out)}: ${
    Object.keys(ingredients).length
  } ingredient names, ${wanted.size} USDA foods`
)
