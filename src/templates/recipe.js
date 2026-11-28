import React, { useEffect } from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Icon from "../components/Icon"
import RecipeImage from "../components/RecipeImage"
import RecipeCard from "../components/RecipeCard"
import SaveButton from "../components/SaveButton"
import SectionHeading from "../components/SectionHeading"
import Ingredients from "../components/recipe/Ingredients"
import Method from "../components/recipe/Method"
import ShareActions from "../components/recipe/ShareActions"
import NutritionPanel from "../components/recipe/NutritionPanel"
import { useTimers } from "../components/recipe/useTimers"
import SplitText from "../components/motion/SplitText"
import { ScrollSpin } from "../components/motion/ScrollMotion"
import { addRecent } from "../lib/storage"
import { reveal } from "../lib/reveal"

const hostOf = url => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

const RecipePage = ({ data, location }) => {
  const { recipe, related } = data
  const { start } = useTimers()
  const sourceHost = recipe.source && hostOf(recipe.source)

  useEffect(() => addRecent(recipe), [recipe])

  return (
    <Layout>
      <article>
        <header className="page grid items-center gap-10 pb-12 pt-6 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pb-20 lg:pt-10 print:block print:pb-6">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="text-sm text-muted"
              data-noprint
            >
              <ol className="flex flex-wrap gap-2">
                <li>
                  <Link to="/recipes" className="hover:text-ink">
                    Recipes
                  </Link>
                  <span aria-hidden="true" className="ml-2">
                    /
                  </span>
                </li>
                <li>
                  <Link
                    to={`/category/${recipe.categorySlug}`}
                    className="hover:text-ink"
                  >
                    {recipe.category}
                  </Link>
                </li>
              </ol>
            </nav>

            <SplitText
              as="h1"
              text={recipe.name}
              className="mt-4 text-display-lg"
            />
            {recipe.contributor && (
              <p className="mt-3 text-muted">
                Shared by {recipe.contributor}, a Sizzle cook
              </p>
            )}

            <dl
              ref={reveal}
              data-reveal="up"
              style={{ "--i": 4 }}
              className="mt-8 grid max-w-lg grid-cols-3 gap-4 border-y border-line py-5"
            >
              <div>
                <dt className="text-sm text-muted">Cuisine</dt>
                <dd className="mt-1 font-display text-lg leading-snug">
                  {recipe.cuisine ? (
                    <Link
                      to={`/recipes?cuisine=${encodeURIComponent(
                        recipe.cuisine
                      )}`}
                      className="hover:text-herb"
                    >
                      {recipe.cuisine}
                    </Link>
                  ) : (
                    "Not listed"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Ingredients</dt>
                <dd className="mt-1 font-display text-lg">
                  {recipe.ingredientCount}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Steps</dt>
                <dd className="mt-1 font-display text-lg">
                  {recipe.stepCount}
                </dd>
              </div>
            </dl>

            {recipe.tags.length > 0 && (
              <ul
                ref={reveal}
                data-reveal="up"
                style={{ "--i": 5 }}
                className="mt-5 flex flex-wrap gap-2"
                aria-label="Tags"
                data-noprint
              >
                {recipe.tags.map(tag => (
                  <li key={tag}>
                    <Link
                      to={`/recipes?q=${encodeURIComponent(tag.toLowerCase())}`}
                      className="chip"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            <div
              ref={reveal}
              data-reveal="up"
              style={{ "--i": 6 }}
              className="mt-8 flex flex-wrap gap-2"
              data-noprint
            >
              <SaveButton recipe={recipe} labelled />
              {recipe.youtube && (
                <a
                  href={recipe.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-quiet"
                >
                  <Icon name="play" className="h-4 w-4 text-herb" filled />
                  Watch video
                  <span className="sr-only"> (opens YouTube in a new tab)</span>
                </a>
              )}
              <ShareActions title={recipe.name} />
            </div>
          </div>

          <div
            ref={reveal}
            data-reveal="spin"
            className="mx-auto w-full max-w-[30rem] print:hidden"
          >
            <ScrollSpin className="plate aspect-square" turn={100}>
              <RecipeImage
                src={recipe.image}
                alt={recipe.name}
                eager
                sizes="(min-width: 1024px) 480px, 90vw"
                className="h-full w-full"
              />
            </ScrollSpin>
          </div>
        </header>

        <div className="border-t border-line bg-surface print:border-0 print:bg-transparent">
          <div className="page grid gap-14 py-14 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-20 lg:py-20 print:block print:py-0">
            <div className="lg:sticky lg:top-24 lg:self-start print:static print:mb-10">
              <Ingredients ingredients={recipe.ingredients} />
            </div>
            <div>
              <Method
                sections={recipe.method}
                location={location}
                onStartTimer={timer =>
                  start({
                    ...timer,
                    recipe: { name: recipe.name, slug: recipe.slug },
                  })
                }
              />
              <p className="mt-12 border-t border-line pt-6 text-sm text-muted">
                {recipe.updatedAt && <>Updated {recipe.updatedAt}. </>}
                {sourceHost ? (
                  <>
                    Original recipe from{" "}
                    <a
                      href={recipe.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link font-normal"
                    >
                      {sourceHost}
                    </a>
                    , via TheMealDB.
                  </>
                ) : (
                  <>Recipe via TheMealDB</>
                )}
              </p>
            </div>
          </div>
        </div>
      </article>

      <div id="nutrition" className="page mt-16 scroll-mt-24">
        <NutritionPanel recipe={recipe} />
      </div>

      {related.nodes.length > 0 && (
        <section
          aria-labelledby="related-title"
          className="page mt-20"
          data-noprint
        >
          <SectionHeading
            id="related-title"
            title={`More ${recipe.category.toLowerCase()} recipes`}
            link={`/category/${recipe.categorySlug}`}
            linkLabel={`All ${recipe.category.toLowerCase()} recipes`}
          />
          <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {related.nodes.map((r, i) => (
              <li key={r.recipeId}>
                <RecipeCard recipe={r} index={i} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Layout>
  )
}

export default RecipePage

export const Head = ({ data: { recipe } }) => {
  const description = `${recipe.name}: a ${
    recipe.cuisine ? `${recipe.cuisine} ` : ""
  }${recipe.category.toLowerCase()} recipe with ${
    recipe.ingredientCount
  } ingredients and ${recipe.stepCount} steps.`
  const structured = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    image: [recipe.image],
    description,
    recipeCategory: recipe.category,
    recipeCuisine: recipe.cuisine || undefined,
    keywords: recipe.tags.join(", ") || undefined,
    recipeIngredient: recipe.ingredients.map(i =>
      [i.measure, i.name].filter(Boolean).join(" ")
    ),
    recipeInstructions: recipe.method.flatMap(section =>
      section.steps.map(text => ({ "@type": "HowToStep", text }))
    ),
  }
  return (
    <Seo
      title={recipe.name}
      description={description}
      image={`${recipe.image}/large`}
    >
      {/* Escape "<" so recipe text from the API can never close the script tag. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
    </Seo>
  )
}

export const query = graphql`
  query RecipePage($id: String!, $categorySlug: String!) {
    recipe(id: { eq: $id }) {
      ...RecipeCard
      categorySlug
      tags
      method {
        title
        steps
      }
      stepCount
      ingredients {
        name
        measure
      }
      youtube
      source
      contributor
      updatedAt(formatString: "D MMMM YYYY")
      nutrition
    }
    related: allRecipe(
      filter: { categorySlug: { eq: $categorySlug }, id: { ne: $id } }
      sort: [{ updatedAt: DESC }, { name: ASC }]
      limit: 4
    ) {
      nodes {
        ...RecipeCard
      }
    }
  }
`
