// Buttondown adapter for the newsletter service (https://docs.buttondown.com/api-subscribers-create).
// New subscribers are "unactivated" until they click Buttondown's confirmation email (double
// opt-in is Buttondown's default and we don't override it), so nothing is complete until then.

const ENDPOINT = "https://api.buttondown.com/v1/subscribers"

export const createButtondown = ({ apiKey, apiVersion, fetch }) => ({
  name: "buttondown",

  /** @returns {Promise<{ status: "pending" | "exists" | "rejected" | "rate_limited" | "unavailable", detail?: string }>} */
  async subscribe({ email, ipAddress, tags = [] }) {
    let response
    try {
      response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
          ...(apiVersion && { "X-API-Version": apiVersion }),
        },
        body: JSON.stringify({
          email_address: email,
          // Buttondown's spam firewall judges the visitor's IP; without it every sign-up
          // would appear to come from our server.
          ...(ipAddress && { ip_address: ipAddress }),
          ...(tags.length && { tags }),
        }),
        signal: AbortSignal.timeout(8000),
      })
    } catch {
      return { status: "unavailable" }
    }

    if (response.ok) return { status: "pending" }
    if (response.status === 429) return { status: "rate_limited" }
    // A bad or revoked key is our problem, not the visitor's address.
    if (response.status >= 500 || response.status === 401)
      return { status: "unavailable" }
    // An existing address is a 400; the error body isn't documented, so match its wording and
    // treat anything else as a rejection rather than assume success.
    const detail = (await response.text().catch(() => "")).slice(0, 300)
    if (response.status === 400 && /already|exist|duplicate/i.test(detail))
      return { status: "exists" }
    return { status: "rejected", detail }
  },
})
