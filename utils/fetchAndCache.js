// utils/fetchAndCache.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const cacheDir = path.join(__dirname, "../src/_data");

const fetchAndCache = async (url, fileName) => {
  const filePath = path.join(cacheDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(`🔁 Using cached data: ${fileName}`);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  console.log(`🌐 Fetching from API: ${url}`);
  const response = await fetch(url);
  const data = await response.json();

  // Ensure directory exists
  fs.mkdirSync(cacheDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return data;
};

module.exports = fetchAndCache;
