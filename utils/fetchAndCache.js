const fs = require("fs")
const path = require("path")

const cacheDir = path.join(__dirname, "../src/_data")

// Fetches JSON once and caches it under src/_data; delete the file to refresh it.
const fetchAndCache = async (url, fileName) => {
  const filePath = path.join(cacheDir, fileName)

  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
  }

  console.log(`Fetching ${url}`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Fetching ${url} failed with ${response.status}`)
  }
  const data = await response.json()

  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

  return data
}

module.exports = fetchAndCache
