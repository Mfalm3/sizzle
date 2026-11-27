// POST /api/newsletter/subscribe: a Gatsby Function (deployed as a Netlify Function), so the
// newsletter provider's API key never reaches the browser.
import { handleSubscribe } from "../../services/newsletter/index.js"

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store")
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ ok: false, message: "Method not allowed" })
  }
  // The visitor's IP, for the provider's spam checks: Netlify's header first, then the proxy chain.
  const ip =
    req.headers["x-nf-client-connection-ip"] ||
    String(req.headers["x-forwarded-for"] || "")
      .split(",")[0]
      .trim() ||
    undefined

  const { status, json } = await handleSubscribe({
    body: req.body || {},
    ip,
    now: Date.now(),
    env: process.env,
    fetch,
  })
  return res.status(status).json(json)
}
