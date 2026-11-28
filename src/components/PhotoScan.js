import React, { useEffect, useId, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import Icon from "./Icon"
import { ease } from "../lib/motion"

// Shown only once scanning is switched on for the build (GATSBY_PANTRY_SCAN_ENABLED=true, set
// alongside ANTHROPIC_API_KEY), so the page never offers a button that can't work.
export const PHOTO_SCAN_ENABLED =
  process.env.GATSBY_PANTRY_SCAN_ENABLED === "true"

const ENDPOINT = "/api/pantry/scan"
const MAX_FILE_BYTES = 20 * 1024 * 1024
const LONG_EDGE = 1568 // plenty for reading labels and lists, and keeps each request small
const MODES = {
  photo: { label: "Photo of food", icon: "camera" },
  list: { label: "Shopping list", icon: "list" },
}
const CONFIDENCE = { medium: "Probably", low: "Not sure" }

// Photos already read this visit, so picking the same one again costs nothing.
const results = new Map()

const toBase64 = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })

// Decode, shrink to LONG_EDGE and re-encode as JPEG. Also drops EXIF data such as location.
const prepare = async file => {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  })
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise(resolve =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  )
  return { blob, image: await toBase64(blob) }
}

const fingerprint = async (mode, image) => {
  if (!window.crypto?.subtle) return null
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(mode + image)
  )
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
}

// Reads ingredients from a photo of food or of a shopping list, then lets the cook check the
// list before anything is added: guesses the model was unsure about start unticked.
const PhotoScan = ({ onAdd, isKnown }) => {
  const id = useId()
  const fileInput = useRef(null)
  const [mode, setMode] = useState("photo")
  const [state, setState] = useState({ status: "idle" })
  const [selected, setSelected] = useState(new Set())

  // Free the preview image's memory when it's replaced.
  useEffect(
    () => () => state.preview && URL.revokeObjectURL(state.preview),
    [state.preview]
  )

  if (!PHOTO_SCAN_ENABLED) return null

  const choose = next => {
    setMode(next)
    fileInput.current.value = ""
    fileInput.current.click()
  }

  const read = async file => {
    if (!file) return
    if (!file.type.startsWith("image/"))
      return setState({ status: "error", message: "Choose a photo" })
    if (file.size > MAX_FILE_BYTES)
      return setState({
        status: "error",
        message: "That photo is over 20 MB. Try a smaller one.",
      })

    let prepared
    try {
      prepared = await prepare(file)
    } catch {
      return setState({
        status: "error",
        message:
          "This browser can't open that photo. Try a JPEG or PNG, or take a screenshot of it.",
      })
    }
    const preview = URL.createObjectURL(prepared.blob)
    setState({ status: "reading", preview })

    const key = await fingerprint(mode, prepared.image)
    let reply = key && results.get(key)
    if (!reply) {
      try {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            mediaType: "image/jpeg",
            image: prepared.image,
          }),
        })
        reply = await response.json().catch(() => ({
          ok: false,
          message:
            "We couldn't read that photo right now. Try again in a minute.",
        }))
      } catch {
        reply = {
          ok: false,
          message:
            "We couldn't reach the server. Check your connection and try again.",
        }
      }
      if (reply.ok && key) results.set(key, reply)
    }

    if (!reply.ok)
      return setState({ status: "error", message: reply.message, preview })
    setSelected(
      new Set(reply.items.filter(i => i.confidence !== "low").map(i => i.name))
    )
    setState({ status: "review", items: reply.items, preview })
  }

  const toggle = name =>
    setSelected(current => {
      const next = new Set(current)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })

  const add = () => {
    onAdd(state.items.map(i => i.name).filter(name => selected.has(name)))
    setState({ status: "idle" })
  }

  const busy = state.status === "reading"
  const chosen = state.items?.filter(i => selected.has(i.name)).length || 0

  return (
    <div className="mt-5 border-t border-line pt-5">
      <p className="text-sm font-semibold" id={`${id}-label`}>
        Or add from a photo
      </p>
      <div
        className="mt-2 flex flex-wrap gap-2"
        role="group"
        aria-labelledby={`${id}-label`}
      >
        {Object.entries(MODES).map(([key, { label, icon }]) => (
          <button
            key={key}
            type="button"
            className="btn-quiet"
            disabled={busy}
            onClick={() => choose(key)}
          >
            <Icon name={icon} className="h-[18px] w-[18px]" />
            {label}
          </button>
        ))}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={event => read(event.target.files[0])}
        />
      </div>
      <p className="mt-1.5 text-sm text-muted">
        Photos are sent to Anthropic's Claude to read. Sizzle doesn't keep them.
      </p>

      <div aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          {state.status !== "idle" && (
            <motion.div
              key={state.status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.3, ease }}
              className="mt-4 flex gap-4 rounded-xl border border-line bg-paper p-4"
            >
              {state.preview && (
                <img
                  src={state.preview}
                  alt=""
                  className={`h-20 w-20 shrink-0 rounded-lg object-cover ${busy ? "animate-pulse" : ""}`}
                />
              )}
              <div className="min-w-0 flex-1">
                {busy && (
                  <p className="font-semibold">
                    Reading your {mode === "list" ? "list" : "photo"}…
                  </p>
                )}

                {state.status === "error" && (
                  <div role="alert">
                    <p className="font-semibold text-danger">{state.message}</p>
                    <button
                      type="button"
                      className="link mt-2 text-sm"
                      onClick={() => setState({ status: "idle" })}
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {state.status === "review" && !state.items.length && (
                  <>
                    <p className="font-semibold">
                      No ingredients found in that{" "}
                      {mode === "list" ? "list" : "photo"}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Try a closer, brighter photo, or type them above
                    </p>
                    <button
                      type="button"
                      className="link mt-2 text-sm"
                      onClick={() => setState({ status: "idle" })}
                    >
                      Dismiss
                    </button>
                  </>
                )}

                {state.status === "review" && state.items.length > 0 && (
                  <fieldset>
                    <legend className="font-semibold">
                      Found {state.items.length}{" "}
                      {state.items.length === 1 ? "ingredient" : "ingredients"}
                    </legend>
                    <p className="text-sm text-muted">
                      Untick anything that's wrong. You can edit names after
                      adding them.
                    </p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {state.items.map(item => {
                        const known = !isKnown || isKnown(item.name)
                        return (
                          <li key={item.name}>
                            <label className="chip cursor-pointer gap-2 has-[:checked]:border-herb/40 has-[:checked]:bg-herb-soft">
                              <input
                                type="checkbox"
                                checked={selected.has(item.name)}
                                onChange={() => toggle(item.name)}
                                className="h-4 w-4 rounded accent-herb"
                              />
                              {item.name}
                              {CONFIDENCE[item.confidence] && (
                                <span className="text-xs text-muted">
                                  {CONFIDENCE[item.confidence]}
                                </span>
                              )}
                              {!known && (
                                <span className="text-xs text-muted">
                                  No recipes
                                </span>
                              )}
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!chosen}
                        onClick={add}
                      >
                        Add {chosen}{" "}
                        {chosen === 1 ? "ingredient" : "ingredients"}
                      </button>
                      <button
                        type="button"
                        className="btn-quiet"
                        onClick={() => setState({ status: "idle" })}
                      >
                        Cancel
                      </button>
                    </div>
                  </fieldset>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PhotoScan
