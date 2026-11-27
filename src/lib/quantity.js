// Scales free-text measures from TheMealDB ("1 1/2 cups", "175g/6oz", "½ tsp").

const VULGAR = {
  "⅛": 1 / 8,
  "¼": 1 / 4,
  "⅓": 1 / 3,
  "½": 1 / 2,
  "⅔": 2 / 3,
  "¾": 3 / 4,
}
const FRACTIONS = Object.entries(VULGAR).sort((a, b) => a[1] - b[1])

// Mixed numbers first so "1 1/2" is read as one quantity, not two.
const QUANTITY =
  /\d+(?:\.\d+)?\s+\d+\/\d+|\d+\s*[⅛¼⅓½⅔¾]|\d+\/\d+|\d+(?:\.\d+)?|[⅛¼⅓½⅔¾]/g

export const parseQuantity = token => {
  const vulgar = token.match(/[⅛¼⅓½⅔¾]/)
  const rest = token.replace(/[⅛¼⅓½⅔¾]/, "").trim()
  let value = vulgar ? VULGAR[vulgar[0]] : 0
  for (const part of rest.split(/\s+/).filter(Boolean)) {
    const [num, den] = part.split("/")
    value += den ? Number(num) / Number(den) : Number(num)
  }
  return value
}

export const formatQuantity = value => {
  if (value >= 10) return String(Math.round(value))
  let whole = Math.floor(value)
  const rest = value - whole
  if (rest < 0.06) return String(whole || Math.round(value * 100) / 100)
  if (rest > 0.94) return String(whole + 1)
  const match = FRACTIONS.find(([, f]) => Math.abs(f - rest) < 0.04)
  if (!match) return String(Math.round(value * 10) / 10)
  return `${whole || ""}${match[0]}`
}

// shortcut: scales every number in the text, so "1 x 400g tin" doubles to "2 x 800g tin"; parse units if that matters.
export const scaleMeasure = (measure, factor) => {
  if (!measure || factor === 1) return measure
  return measure.replace(QUANTITY, token =>
    formatQuantity(parseQuantity(token) * factor)
  )
}
