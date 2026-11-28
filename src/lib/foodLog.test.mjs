import { test } from "node:test"
import assert from "node:assert/strict"
import {
  dayKey,
  shiftDay,
  mealForHour,
  parseLog,
  parseTarget,
  dayTotals,
  history,
} from "./foodLog.js"

const entry = (over = {}) => ({
  id: "1-stew",
  date: "2026-11-27",
  meal: "dinner",
  recipe: { name: "Beef Stew", slug: "beef-stew" },
  servings: 0.25,
  kcal: 520,
  protein: 31,
  carbs: 40,
  fat: 22,
  partial: false,
  ...over,
})

test("uses local calendar dates and walks across months", () => {
  assert.equal(dayKey(new Date(2026, 0, 5, 23, 30)), "2026-01-05")
  assert.equal(shiftDay("2026-03-01", -1), "2026-02-28")
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01")
})

test("suggests a meal from the time of day", () => {
  assert.equal(mealForHour(8), "breakfast")
  assert.equal(mealForHour(13), "lunch")
  assert.equal(mealForHour(16), "snack")
  assert.equal(mealForHour(19), "dinner")
  assert.equal(mealForHour(23), "snack")
})

test("keeps only well-formed stored entries", () => {
  const good = entry()
  assert.deepEqual(parseLog(JSON.stringify([good])), [good])
  assert.deepEqual(parseLog("nope"), [])
  assert.deepEqual(parseLog(null), [])
  const bad = [
    entry({ meal: "brunch" }),
    entry({ kcal: -5 }),
    entry({ date: "27/11/2026" }),
    entry({ servings: 0 }),
    entry({ recipe: { name: "X", slug: "../evil" } }),
    null,
  ]
  assert.deepEqual(parseLog(JSON.stringify([...bad, good])), [good])
})

test("accepts only sensible calorie targets", () => {
  assert.equal(parseTarget("2000"), 2000)
  assert.equal(parseTarget("1850.6"), 1851)
  for (const bad of ["", "0", "-100", "abc", "999999", null])
    assert.equal(parseTarget(bad), null)
})

test("totals a day by meal", () => {
  const entries = [
    entry(),
    entry({
      id: "2",
      meal: "breakfast",
      kcal: 300,
      protein: 10,
      carbs: 50,
      fat: 5,
    }),
    entry({ id: "3", date: "2026-11-26", kcal: 999 }),
  ]
  const t = dayTotals(entries, "2026-11-27")
  assert.equal(t.kcal, 820)
  assert.equal(t.protein, 41)
  assert.equal(t.count, 2)
  assert.deepEqual(
    t.byMeal.breakfast.map(e => e.id),
    ["2"]
  )
  assert.deepEqual(t.byMeal.lunch, [])
})

test("builds a week of daily calories, oldest first", () => {
  const entries = [entry(), entry({ id: "2", date: "2026-11-25", kcal: 400 })]
  const week = history(entries, "2026-11-27", 7)
  assert.equal(week.length, 7)
  assert.equal(week[0].date, "2026-11-21")
  assert.deepEqual(
    week.slice(-3).map(d => d.kcal),
    [400, 0, 520]
  )
})
