import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SplitText from "../components/motion/SplitText"
import { reveal } from "../lib/reveal"
import RecipeCard from "../components/RecipeCard"

const CategoryPage = ({ data }) => {
  const { category, recipes, cuisines } = data
  const topCuisines = [...cuisines.group]
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 8)

  return (
    <Layout>
      <header className="page grid items-center gap-10 pb-14 pt-8 md:grid-cols-[1fr_auto] lg:pb-20">
        <div className="max-w-2xl">
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link to="/recipes" className="hover:text-ink">
              Recipes
            </Link>
          </nav>
          <SplitText
            as="h1"
            by="char"
            text={category.name}
            className="mt-4 text-display-xl"
          />
          <p
            ref={reveal}
            data-reveal="up"
            style={{ "--i": 4 }}
            className="mt-5 text-lg text-muted"
          >
            {category.description
              .split(/(?<=\.)\s/)
              .slice(0, 2)
              .join(" ")}
          </p>
          <p
            ref={reveal}
            data-reveal="up"
            style={{ "--i": 5 }}
            className="mt-6 font-semibold"
          >
            {category.recipeCount} recipes
          </p>
          {topCuisines.length > 1 && (
            <ul
              className="mt-5 flex flex-wrap gap-2"
              aria-label={`${category.name} recipes by cuisine`}
            >
              {topCuisines.map((c, i) => (
                <li
                  key={c.fieldValue}
                  ref={reveal}
                  data-reveal="up"
                  style={{ "--i": 6 + i * 0.5 }}
                >
                  <Link
                    to={`/recipes?category=${encodeURIComponent(
                      category.name
                    )}&cuisine=${encodeURIComponent(c.fieldValue)}`}
                    className="chip"
                  >
                    {c.fieldValue}
                    <span className="text-muted">{c.totalCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div
          ref={reveal}
          data-reveal="spin"
          className="plate hidden aspect-square w-72 items-center justify-center md:flex lg:w-80"
        >
          <img
            src={category.image}
            alt=""
            width="320"
            height="200"
            className="w-[80%]"
          />
        </div>
      </header>

      <section aria-label={`${category.name} recipes`} className="page">
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.nodes.map((recipe, i) => (
            <li key={recipe.recipeId}>
              <RecipeCard recipe={recipe} headingLevel="h2" index={i % 4} />
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  )
}

export default CategoryPage

export const Head = ({ data: { category } }) => (
  <Seo
    title={`${category.name} recipes`}
    description={`${
      category.recipeCount
    } ${category.name.toLowerCase()} recipes from around the world.`}
    image={category.image}
  />
)

export const query = graphql`
  query CategoryPage($id: String!, $name: String!) {
    category(id: { eq: $id }) {
      name
      image
      description
      recipeCount
    }
    recipes: allRecipe(
      filter: { category: { eq: $name } }
      sort: { name: ASC }
    ) {
      nodes {
        ...RecipeCard
      }
    }
    cuisines: allRecipe(
      filter: { category: { eq: $name }, cuisine: { ne: null } }
    ) {
      group(field: { cuisine: SELECT }) {
        fieldValue
        totalCount
      }
    }
  }
`
