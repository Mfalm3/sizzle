import React from "react"

// TheMealDB serves square photos at 350, 500 and 700px by suffixing the URL,
// so the browser can pick the smallest that fills the slot.
const RecipeImage = ({ src, alt, sizes, className = "", eager = false }) => (
  <img
    src={`${src}/medium`}
    srcSet={`${src}/medium 350w, ${src}/large 500w, ${src} 700w`}
    sizes={sizes}
    alt={alt}
    width="700"
    height="700"
    loading={eager ? "eager" : "lazy"}
    fetchpriority={eager ? "high" : undefined}
    decoding="async"
    className={`bg-line object-cover ${className}`}
  />
)

export default RecipeImage
