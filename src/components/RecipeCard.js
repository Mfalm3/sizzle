import React from "react"
import { Link, graphql } from "gatsby"
import RecipeImage from "./RecipeImage"
import SaveButton from "./SaveButton"
import Tilt from "./motion/Tilt"
import { reveal as revealRef } from "../lib/reveal"

export const RecipeMeta = ({ recipe, className = "" }) => (
  <p className={`flex flex-wrap gap-x-3 text-sm text-muted ${className}`}>
    {recipe.cuisine && <span>{recipe.cuisine}</span>}
    <span>{recipe.ingredientCount} ingredients</span>
  </p>
)

// "tile" for grids and rails, "row" for compact lists. The title link stretches over the card
// so the whole card is clickable while the save button stays its own control.
// `index` staggers the scroll reveal; pass reveal={false} where the parent animates the card.
const RecipeCard = ({
  recipe,
  variant = "tile",
  sizes,
  headingLevel: H = "h3",
  index = 0,
  reveal = true,
}) => {
  const revealProps = reveal
    ? {
        ref: revealRef,
        "data-reveal": variant === "row" ? "up" : "card",
        style: { "--i": index },
      }
    : {}

  if (variant === "row") {
    return (
      <article
        {...revealProps}
        className="group relative flex items-center gap-4"
      >
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full">
          <RecipeImage
            src={recipe.image}
            alt=""
            sizes="96px"
            className="h-full w-full transition-transform duration-700 ease-out group-hover:rotate-12 group-hover:scale-110"
          />
        </div>
        <div className="min-w-0">
          <H className="font-display text-lg leading-snug">
            <Link
              to={`/recipes/${recipe.slug}`}
              className="nav-link after:absolute after:inset-0 group-hover:text-herb"
            >
              {recipe.name}
            </Link>
          </H>
          <RecipeMeta recipe={recipe} className="mt-1" />
        </div>
      </article>
    )
  }

  return (
    <article {...revealProps} className="group relative">
      <Tilt className="relative rounded-xl">
        <div className="card-media relative overflow-hidden rounded-xl">
          <div className="transition-transform duration-700 ease-out group-hover:scale-[1.07]">
            <RecipeImage
              src={recipe.image}
              alt=""
              sizes={
                sizes ||
                "(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
              }
              className="aspect-[4/3] w-full"
            />
          </div>
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-3 translate-y-4 rounded-full bg-surface/95 px-3.5 py-1.5 text-sm font-semibold opacity-0 transition duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100"
          >
            Cook this
          </span>
        </div>
      </Tilt>
      {/* Outside Tilt on purpose: the tilt's 3D transform makes a stacking context, which would
          trap the button's z-index below the title link's full-card click area. */}
      <SaveButton
        recipe={recipe}
        className="absolute right-3 top-3 z-20 border-transparent bg-surface/90"
      />
      <div className="card-text">
        <H className="mt-3 font-display text-display-sm">
          <Link
            to={`/recipes/${recipe.slug}`}
            className="after:absolute after:inset-0 group-hover:text-herb"
          >
            {recipe.name}
          </Link>
        </H>
        <RecipeMeta recipe={recipe} className="mt-1" />
      </div>
    </article>
  )
}

export default RecipeCard

export const query = graphql`
  fragment RecipeCard on Recipe {
    recipeId
    slug
    name
    category
    cuisine
    image
    ingredientCount
  }
`
