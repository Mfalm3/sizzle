// POST /api/pantry/scan: a Gatsby Function (deployed as a Netlify Function), so the Anthropic API
// key never reaches the browser.
import Anthropic from "@anthropic-ai/sdk"
import { handleScan } from "../../services/pantryScan/index.js"

// The browser shrinks photos before sending, but allow for a full-size 4 MB image as base64.
export const config = { bodyParser: { json: { limit: "6mb" } } }

const createMessages = apiKey =>
  new Anthropic({ apiKey, timeout: 60_000, maxRetries: 1 }).beta.messages

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ ok: false, message: "Method not allowed" })
  }
  const ip =
    req.headers["x-nf-client-connection-ip"] ||
    String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim() ||
    undefined

  const { status, json } = await handleScan({
    body: req.body || {},
    ip,
    now: Date.now(),
    // Not `process.env`: Gatsby's bundler replaces that with the build-time values (`{}` here),
    // and the key must be read when the function runs.
    env: globalThis.process.env,
    createMessages,
  })
  return res.status(status).json(json)
}
