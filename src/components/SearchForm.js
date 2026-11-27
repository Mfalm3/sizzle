import React, { useState } from "react"
import { navigate } from "gatsby"
import Icon from "./Icon"

// Sends a search to the recipe index. Used in the hero and the header.
// `autoFocus` only marks the field (data-autofocus) for the Drawer, which owns focus while open.
const SearchForm = ({
  id = "search",
  size = "lg",
  autoFocus = false,
  onSubmitted,
}) => {
  const [q, setQ] = useState("")
  const large = size === "lg"

  return (
    <form
      role="search"
      className="relative flex w-full items-center"
      onSubmit={event => {
        event.preventDefault()
        const query = q.trim()
        navigate(query ? `/recipes?q=${encodeURIComponent(query)}` : "/recipes")
        onSubmitted?.()
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search recipes by dish or ingredient
      </label>
      <Icon
        name="search"
        className="pointer-events-none absolute left-5 h-5 w-5 text-muted"
      />
      <input
        id={id}
        type="search"
        value={q}
        onChange={event => setQ(event.target.value)}
        placeholder={large ? "Dish or ingredient" : "Search recipes"}
        autoComplete="off"
        data-autofocus={autoFocus || undefined}
        className={`input pl-12 ${
          large ? "min-h-[3.5rem] pr-32 text-lg shadow-lift" : "pr-24"
        }`}
      />
      <button
        type="submit"
        className={`btn-primary absolute right-1.5 ${
          large ? "min-h-[2.75rem] px-6" : "min-h-[2.25rem] px-4"
        }`}
      >
        Search
      </button>
    </form>
  )
}

export default SearchForm
