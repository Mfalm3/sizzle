import { test } from "node:test"
import assert from "node:assert/strict"
import {
  normalizeIngredient,
  ingredientMatches,
  isStaple,
  dietOf,
  recommend,
  parsePantryList,
  pantryFromSearch,
  pantryToSearch,
} from "./pantry.js"

const words = name => normalizeIngredient(name).words.join(" ")

test("normalizes plurals, descriptors, punctuation and aliases", () => {
  assert.equal(words("Chopped Tomatoes"), "tomato")
  assert.equal(words("Tinned Tomatos"), "tomato")
  assert.equal(words("Free-range Egg, Beaten"), "egg")
  assert.equal(words("Red Chillies"), "red chilli")
  assert.equal(words("Bay Leaves"), "bay leaf")
  assert.equal(words("Extra Virgin Olive Oil"), "olive oil")
  assert.equal(words("All purpose flour"), "flour")
  assert.equal(words("Ground Black Pepper"), "black pepper")
  assert.equal(words("Egg Plants"), "aubergine")
  assert.equal(words("Cilantro"), "coriander")
  assert.equal(words("Prawns"), "shrimp")
})

const yes = (have, need) =>
  assert.ok(
    ingredientMatches(normalizeIngredient(have), normalizeIngredient(need)),
    `${have} should satisfy ${need}`
  )
const no = (have, need) =>
  assert.ok(
    !ingredientMatches(normalizeIngredient(have), normalizeIngredient(need)),
    `${have} should NOT satisfy ${need}`
  )

test("whole ingredients satisfy their forms and parts", () => {
  yes("tomatoes", "Chopped Tomatoes")
  yes("tomatoes", "Cherry Tomatoes")
  yes("tomato", "Tinned Tomatos")
  yes("chicken", "Chicken Breast")
  yes("chicken", "Chicken Thighs")
  yes("eggs", "Egg Yolks")
  yes("garlic", "Garlic Clove")
  yes("lemon", "Lemon Juice")
  yes("lemons", "Lemon Zest")
  yes("onion", "Red Onions")
  yes("cheese", "Cheddar Cheese")
  yes("flour", "Plain Flour")
  yes("beef", "Minced Beef")
})

test("a more specific pantry item satisfies a generic need", () => {
  yes("cheddar cheese", "Cheese")
  yes("olive oil", "Oil")
  yes("chicken breasts", "Chicken")
})

test("processed products and different foods never match", () => {
  no("tomatoes", "Tomato Puree")
  no("tomatoes", "Tomato Sauce")
  no("tomatoes", "Tomato Ketchup")
  no("tomatoes", "Sun-Dried Tomatoes")
  no("tomato puree", "Tomatoes")
  no("garlic", "Garlic Powder")
  no("garlic powder", "Garlic")
  no("chicken", "Chicken Stock")
  no("eggs", "Egg Plants")
  no("eggs", "Egg Noodles")
  no("milk", "Coconut Milk")
  no("coconut milk", "Milk")
  no("cheese", "Cream Cheese")
  no("beef", "Beef Tomatoes")
  no("onion", "Spring Onions")
  no("onion", "Onion Salt")
})

test("recognizes pantry basics exactly", () => {
  for (const s of [
    "Salt",
    "Sea Salt",
    "Black Pepper",
    "Pepper",
    "Water",
    "Boiling Water",
    "Olive Oil",
    "Vegetable Oil",
    "Oil",
  ]) {
    assert.ok(isStaple(normalizeIngredient(s)), `${s} is a basic`)
  }
  for (const s of [
    "Red Pepper",
    "Onion Salt",
    "Sesame Seed Oil",
    "Coconut Water",
  ]) {
    assert.ok(!isStaple(normalizeIngredient(s)), `${s} is not a basic`)
  }
})

test("infers diet from ingredient names, conservatively", () => {
  const n = list => dietOf(list.map(normalizeIngredient))
  assert.deepEqual(n(["Spinach", "Eggs", "Cheese"]), {
    vegetarian: true,
    vegan: false,
  })
  assert.deepEqual(
    n(["Chickpeas", "Coconut Milk", "Butter Beans", "Cream of Tartar"]),
    { vegetarian: true, vegan: true }
  )
  assert.deepEqual(n(["Rice", "Chicken Stock"]), {
    vegetarian: false,
    vegan: false,
  })
  assert.deepEqual(n(["Noodles", "Fish Sauce"]), {
    vegetarian: false,
    vegan: false,
  })
  assert.deepEqual(n(["Egg Noodles", "Soy Sauce"]), {
    vegetarian: true,
    vegan: false,
  })
  assert.deepEqual(n(["Beef Tomatoes", "Basil"]), {
    vegetarian: true,
    vegan: true,
  })
  assert.deepEqual(n(["Aubergine", "Peanut Butter", "Almond Milk"]), {
    vegetarian: true,
    vegan: true,
  })
  // Found by running the matcher over all 790 recipes
  assert.deepEqual(n(["Kidney Beans", "Rice"]), {
    vegetarian: true,
    vegan: true,
  })
  assert.deepEqual(n(["Sea Bass Fillets"]).vegetarian, false)
  assert.deepEqual(n(["Codfish Bulljaw"]).vegetarian, false)
  assert.deepEqual(n(["Frozen Seafood mix"]).vegetarian, false)
  assert.deepEqual(n(["jamón ibérico"]).vegetarian, false)
  assert.deepEqual(n(["Quail Eggs"]), { vegetarian: true, vegan: false })
  assert.deepEqual(n(["flax eggs", "Cocoa"]), { vegetarian: true, vegan: true })
})

const omelette = {
  recipeId: "1",
  name: "Spinach and Cheese Omelette",
  cuisine: "French",
  ingredientNames: ["Eggs", "Spinach", "Cheese", "Milk", "Salt", "Pepper"],
  stepCount: 3,
  ingredientCount: 6,
}
const stew = {
  recipeId: "2",
  name: "Beef Stew",
  ingredientNames: ["Beef", "Onion", "Carrots", "Beef Stock", "Salt"],
  stepCount: 6,
  ingredientCount: 5,
}
const salad = {
  recipeId: "3",
  name: "Tomato Salad",
  cuisine: "Italian",
  ingredientNames: ["Tomatoes", "Red Onion", "Olive Oil", "Basil"],
  stepCount: 2,
  ingredientCount: 4,
}
const recipes = [omelette, stew, salad]

test("recommends recipes with explained, deterministic matches", () => {
  const results = recommend(recipes, {
    have: ["tomatoes", "onions", "eggs", "spinach", "cheese"],
  })
  assert.deepEqual(
    results.map(r => r.recipe.name),
    ["Spinach and Cheese Omelette", "Tomato Salad", "Beef Stew"]
  )
  const [o] = results
  assert.deepEqual(o.matched, ["Eggs", "Spinach", "Cheese"])
  assert.deepEqual(o.missing, ["Milk"])
  assert.deepEqual(o.basics, ["Salt", "Pepper"])
  assert.equal(o.needed, 4)
  assert.equal(o.percent, 75)
})

test("counts basics as missing when they aren't assumed", () => {
  const [o] = recommend([omelette], {
    have: ["eggs", "spinach", "cheese", "milk"],
    assumeBasics: false,
  })
  assert.deepEqual(o.missing, ["Salt", "Pepper"])
  assert.equal(o.percent, 67)
})

test("leaves out recipes with excluded ingredients or the wrong diet", () => {
  const have = ["onion", "tomatoes", "eggs"]
  assert.deepEqual(
    recommend(recipes, { have, exclude: ["eggs"] }).map(r => r.recipe.name),
    ["Tomato Salad", "Beef Stew"]
  )
  assert.deepEqual(
    recommend(recipes, { have, diet: "vegetarian" }).map(r => r.recipe.name),
    ["Tomato Salad", "Spinach and Cheese Omelette"]
  )
  assert.deepEqual(
    recommend(recipes, { have, diet: "vegan" }).map(r => r.recipe.name),
    ["Tomato Salad"]
  )
})

test("sorts by fewest missing and fewest steps", () => {
  const have = [
    "onion",
    "tomatoes",
    "eggs",
    "spinach",
    "cheese",
    "beef",
    "carrots",
  ]
  assert.deepEqual(
    recommend(recipes, { have: [...have, "basil"], sort: "missing" }).map(
      r => r.missing.length
    ),
    [0, 1, 1]
  )
  assert.deepEqual(
    recommend(recipes, { have, sort: "steps" }).map(r => r.recipe.stepCount),
    [2, 3, 6]
  )
})

test("needs at least one real match, not just basics", () => {
  assert.deepEqual(recommend(recipes, { have: ["salt"] }), [])
  assert.deepEqual(recommend(recipes, { have: [] }), [])
})

test("splits pasted lists into ingredients", () => {
  assert.deepEqual(
    parsePantryList("Tomatoes, onions\n- eggs\n• spinach; cheese"),
    ["Tomatoes", "onions", "eggs", "spinach", "cheese"]
  )
  assert.deepEqual(parsePantryList("  ,  "), [])
})

test("round-trips pantry state through the URL", () => {
  const state = {
    have: ["tomatoes", "eggs"],
    exclude: ["milk"],
    diet: "vegetarian",
    cuisine: "Middle Eastern",
    assumeBasics: false,
    sort: "missing",
  }
  assert.deepEqual(pantryFromSearch(pantryToSearch(state)), state)
  assert.equal(
    pantryToSearch({
      have: [],
      exclude: [],
      diet: "",
      assumeBasics: true,
      sort: "match",
    }),
    ""
  )
  assert.equal(pantryFromSearch("?diet=keto&sort=fast").diet, "")
})

test("keeps only the chosen cuisine", () => {
  const have = ["eggs", "spinach", "tomatoes", "onion"]
  assert.deepEqual(
    recommend(recipes, { have, cuisine: "Italian" }).map(r => r.recipe.name),
    ["Tomato Salad"]
  )
  // Recipes without a cuisine never match a cuisine filter.
  assert.deepEqual(
    recommend([stew], { have: ["beef"], cuisine: "Italian" }),
    []
  )
  assert.equal(recommend(recipes, { have }).length, 3)
})
