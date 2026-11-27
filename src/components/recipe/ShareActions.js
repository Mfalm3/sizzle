import React, { useEffect, useState } from "react"
import Icon from "../Icon"

// Share sheet where the browser has one, plus copy-link and print.
const ShareActions = ({ title }) => {
  const [canShare, setCanShare] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => setCanShare(typeof navigator.share === "function"), [])
  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      window.prompt("Copy this link", window.location.href)
    }
  }

  return (
    <>
      {canShare && (
        <button
          type="button"
          className="btn-quiet"
          onClick={() =>
            navigator
              .share({ title, url: window.location.href })
              .catch(() => {})
          }
        >
          <Icon name="share" />
          Share
        </button>
      )}
      <button type="button" className="btn-quiet" onClick={copy}>
        <Icon
          name={copied ? "check" : "link"}
          className={`h-5 w-5 ${copied ? "text-herb" : ""}`}
        />
        <span aria-live="polite">{copied ? "Link copied" : "Copy link"}</span>
      </button>
      <button
        type="button"
        className="btn-quiet"
        onClick={() => window.print()}
      >
        <Icon name="print" />
        Print
      </button>
    </>
  )
}

export default ShareActions
