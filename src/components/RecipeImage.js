import React from "react"

// TheMealDB serves square photos at 350, 500 and 700px by suffixing the URL,
// so the browser can pick the smallest that fills the slot. Community photos come as uploaded.
const RecipeImage = ({ src, alt, sizes, className = "", eager = false }) => {
  const mealDb = src.includes("themealdb.com")
  return (
    <img
      src={mealDb ? `${src}/medium` : src}
      srcSet={
        mealDb
          ? `${src}/medium 350w, ${src}/large 500w, ${src} 700w`
          : undefined
      }
      sizes={mealDb ? sizes : undefined}
      alt={alt}
      width="700"
      height="700"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      className={`bg-line object-cover ${className}`}
    />
  )
}

export default RecipeImage
