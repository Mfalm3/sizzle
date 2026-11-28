import React, { useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import Icon from "./Icon"
import { ease } from "../lib/motion"
import { normalizeIngredient, parsePantryList } from "../lib/pantry"

// A list of ingredients as removable, editable chips. Type and press Enter or comma to add,
// paste a whole list at once, Backspace on an empty field removes the last one, and selecting a
// chip's name edits it. Suggestions come from a <datalist> of real ingredient names.
// `isKnown(name)` marks chips no recipe uses, so a typo doesn't fail silently.
const IngredientInput = ({
  id,
  label,
  hint,
  values,
  onChange,
  suggestionsId,
  placeholder,
  isKnown,
}) => {
  const [text, setText] = useState("")
  const [editing, setEditing] = useState(null)
  const [announcement, setAnnouncement] = useState("")
  const input = useRef(null)

  const add = raw => {
    const keys = new Set(values.map(v => normalizeIngredient(v).key))
    const added = parsePantryList(raw).filter(name => {
      const key = normalizeIngredient(name).key
      if (!key || keys.has(key)) return false
      keys.add(key)
      return true
    })
    if (added.length) {
      onChange([...values, ...added])
      setAnnouncement(`Added ${added.join(", ")}`)
    }
    setText("")
  }

  const remove = index => {
    setAnnouncement(`Removed ${values[index]}`)
    onChange(values.filter((_, i) => i !== index))
    input.current?.focus()
  }

  const commitEdit = (index, value) => {
    const [name] = parsePantryList(value)
    setEditing(null)
    const key = normalizeIngredient(name).key
    // Empty, or now the same as another chip: drop it rather than keep a duplicate.
    if (
      !key ||
      values.some((v, i) => i !== index && normalizeIngredient(v).key === key)
    )
      return remove(index)
    onChange(values.map((v, i) => (i === index ? name : v)))
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-muted">
          {hint}
        </p>
      )}
      <div
        className="mt-2 flex min-h-[3.25rem] flex-wrap items-center gap-2 rounded-2xl border border-line bg-surface p-2 focus-within:border-herb focus-within:ring-2 focus-within:ring-saffron focus-within:ring-offset-2 focus-within:ring-offset-surface"
        onClick={event =>
          event.target === event.currentTarget && input.current?.focus()
        }
      >
        <ul className="contents" aria-label={label}>
          <AnimatePresence initial={false}>
            {values.map((value, index) => {
              const known = !isKnown || isKnown(value)
              return (
                <motion.li
                  key={value}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{
                    opacity: 0,
                    scale: 0.8,
                    transition: { duration: 0.12 },
                  }}
                  transition={{ duration: 0.25, ease }}
                  className={`flex items-center rounded-full border text-sm ${
                    known
                      ? "border-herb/30 bg-herb-soft text-herb-dark"
                      : "border-dashed border-muted/60 bg-paper text-muted"
                  }`}
                >
                  {editing === index ? (
                    <input
                      autoFocus
                      defaultValue={value}
                      aria-label={`Edit ${value}`}
                      className="w-32 rounded-full bg-transparent px-3 py-1.5 outline-none"
                      onBlur={event => commitEdit(index, event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          commitEdit(index, event.currentTarget.value)
                        }
                        if (event.key === "Escape") setEditing(null)
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditing(index)}
                      className="touch-target rounded-full py-1.5 pl-3 pr-1 text-left"
                      aria-label={`Edit ${value}${
                        known ? "" : ", not used in any recipe"
                      }`}
                      title={
                        known
                          ? "Edit"
                          : "No recipe uses this. Check the spelling?"
                      }
                    >
                      {value}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="touch-target flex h-8 w-8 items-center justify-center rounded-full hover:bg-ink/10"
                    aria-label={`Remove ${value}`}
                  >
                    <Icon name="close" className="h-3.5 w-3.5" />
                  </button>
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>
        <input
          ref={input}
          id={id}
          type="text"
          list={suggestionsId}
          value={text}
          placeholder={values.length ? "Add another" : placeholder}
          aria-describedby={hint ? `${id}-hint` : undefined}
          autoComplete="off"
          enterKeyHint="done"
          className="ingredient-field min-w-[8rem] flex-1 bg-transparent px-2 py-1.5 text-base outline-none placeholder:text-muted/80 focus-visible:ring-0"
          onChange={event => {
            const value = event.target.value
            // A comma (typed or pasted) finishes the ingredient before it.
            if (/[,;\n]/.test(value)) add(value)
            else setText(value)
          }}
          onPaste={event => {
            const pasted = event.clipboardData.getData("text")
            if (/[,;\n]/.test(pasted)) {
              event.preventDefault()
              add(text + pasted)
            }
          }}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.preventDefault()
              add(text)
            }
            if (event.key === "Backspace" && !text && values.length)
              remove(values.length - 1)
          }}
          onBlur={() => text.trim() && add(text)}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

export default IngredientInput
