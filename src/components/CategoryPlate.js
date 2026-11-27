import React from "react"
import { Link } from "gatsby"
import { reveal } from "../lib/reveal"

// TheMealDB category art is a cut-out dish (320x200 PNG), so it sits on a plate rather than in a box.
// Plates spin onto the table as the rail scrolls in; hovering lifts and turns the dish.
const CategoryPlate = ({ category, index = 0 }) => (
  <Link
    to={`/category/${category.slug}`}
    ref={reveal}
    data-reveal="plate"
    style={{ "--i": index }}
    className="group flex w-36 shrink-0 flex-col items-center text-center sm:w-40 lg:w-full"
  >
    <span className="plate flex aspect-square w-full items-center justify-center transition-[transform,box-shadow] duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_32px_48px_-24px_rgba(52,40,20,0.55),0_0_0_10px_#FFFCF6]">
      <img
        src={category.image}
        alt=""
        width="320"
        height="200"
        loading="lazy"
        decoding="async"
        className="w-[78%] transition-transform duration-700 ease-out group-hover:-rotate-12 group-hover:scale-110"
      />
    </span>
    <span className="mt-5 font-display text-lg group-hover:text-herb">
      {category.name}
    </span>
    <span className="text-sm text-muted">{category.recipeCount} recipes</span>
  </Link>
)

export default CategoryPlate
