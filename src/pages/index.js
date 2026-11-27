import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SearchForm from "../components/SearchForm"
import RecipeCard, { RecipeMeta } from "../components/RecipeCard"
import RecipeImage from "../components/RecipeImage"
import CategoryPlate from "../components/CategoryPlate"
import CuisineIndex from "../components/CuisineIndex"
import SectionHeading from "../components/SectionHeading"
import RecentlyViewed from "../components/RecentlyViewed"
import NewsletterSignup from "../components/NewsletterSignup"
import SplitText from "../components/motion/SplitText"
import Magnetic from "../components/motion/Magnetic"
import Marquee from "../components/motion/Marquee"
import HorizontalScroll from "../components/motion/HorizontalScroll"
import { Parallax, ScrollSpin } from "../components/motion/ScrollMotion"
import Icon from "../components/Icon"
import { reveal } from "../lib/reveal"

const STARTERS = ["Chicken", "Coconut milk", "Lentils", "Chocolate", "Salmon"]

const IndexPage = ({ data }) => {
  // Hero: the editor's pick from siteMetadata.featuredRecipe, else the latest update.
  const hero = data.featured || data.latest.nodes[0]
  // One recipe per cuisine, so a bulk import from one country can't fill the section.
  const cuisinesSeen = new Set()
  const [lead, ...updates] = data.latest.nodes
    .filter(
      r =>
        r.recipeId !== hero.recipeId &&
        !cuisinesSeen.has(r.cuisine) &&
        cuisinesSeen.add(r.cuisine)
    )
    .slice(0, 5)
  const cuisines = data.cuisines.nodes

  return (
    <Layout showSearch={false}>
      {/* Hero: one dish, plated. The headline rises word by word while the plate spins onto the table. */}
      <section className="page grid items-center gap-12 pb-16 pt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-24 lg:pt-14">
        <div className="max-w-2xl">
          <SplitText
            as="h1"
            text="Cook something worth sitting down for"
            className="text-display-xl"
          />
          <p
            ref={reveal}
            data-reveal="up"
            style={{ "--i": 5 }}
            className="mt-6 max-w-xl text-lg text-muted"
          >
            {data.all.totalCount} recipes from {cuisines.length} cuisines. Scale
            any shopping list, tick off ingredients as you go and start a timer
            straight from the method.
          </p>
          <div
            ref={reveal}
            data-reveal="up"
            style={{ "--i": 6 }}
            className="mt-8 max-w-xl"
          >
            <SearchForm id="hero-search" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span
              ref={reveal}
              data-reveal="up"
              style={{ "--i": 7 }}
              className="mr-1 text-sm text-muted"
            >
              Or start with
            </span>
            {STARTERS.map((term, i) => (
              <span
                key={term}
                ref={reveal}
                data-reveal="up"
                style={{ "--i": 7 + i }}
              >
                <Magnetic>
                  <Link
                    to={`/recipes?q=${encodeURIComponent(term.toLowerCase())}`}
                    className="chip"
                  >
                    {term}
                  </Link>
                </Magnetic>
              </span>
            ))}
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div ref={reveal} data-reveal="spin" className="mx-auto w-[88%]">
            <ScrollSpin className="plate aspect-square" turn={120}>
              <RecipeImage
                src={hero.image}
                alt={hero.name}
                eager
                sizes="(min-width: 1024px) 520px, 88vw"
                className="h-full w-full"
              />
            </ScrollSpin>
          </div>
          <figcaption
            ref={reveal}
            data-reveal="up"
            style={{ "--i": 9 }}
            className="relative -mt-14 ml-auto mr-2 max-w-[17rem] rounded-xl border border-line bg-surface p-4 shadow-lift sm:-mt-20 sm:mr-0"
          >
            <span className="text-sm text-muted">
              {data.featured ? "Cook this tonight" : "Just updated"}
            </span>
            <Link
              to={`/recipes/${hero.slug}`}
              className="mt-1 block font-display text-xl leading-snug hover:text-herb"
            >
              {hero.name}
            </Link>
            <RecipeMeta recipe={hero} className="mt-1" />
          </figcaption>
        </figure>
      </section>

      <div className="mt-24 space-y-28 lg:mt-32 lg:space-y-40">
        {/* Freshly updated: one lead story and a short list */}
        <section aria-labelledby="latest-title" className="page">
          <SectionHeading
            id="latest-title"
            title="Freshly updated"
            intro="Recipes whose ingredients or method changed most recently"
            link="/recipes?sort=updated"
            linkLabel="See everything recently updated"
          />
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
            <article className="group relative">
              <div
                ref={reveal}
                data-reveal="clip"
                className="overflow-hidden rounded-xl"
              >
                <Parallax className="aspect-[16/10]">
                  <RecipeImage
                    src={lead.image}
                    alt=""
                    sizes="(min-width: 1024px) 680px, 90vw"
                    className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  />
                </Parallax>
              </div>
              <h3 className="mt-5 text-display-md">
                <Link
                  to={`/recipes/${lead.slug}`}
                  className="nav-link after:absolute after:inset-0 group-hover:text-herb"
                >
                  {lead.name}
                </Link>
              </h3>
              <RecipeMeta recipe={lead} className="mt-2 text-base" />
            </article>
            <ul className="divide-y divide-line border-y border-line">
              {updates.map((recipe, i) => (
                <li key={recipe.recipeId} className="py-5">
                  <RecipeCard recipe={recipe} variant="row" index={i} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Categories as plates */}
        <section
          id="categories"
          aria-labelledby="categories-title"
          className="page scroll-mt-24"
        >
          <SectionHeading id="categories-title" title="Browse by category" />
          {/* A swipe row on touch screens; on desktop every plate is on the table at once. */}
          <ul
            aria-label="Categories"
            className="no-scrollbar -mx-5 flex snap-x scroll-px-5 gap-6 overflow-x-auto px-5 pb-8 pt-4 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-7 lg:gap-x-6 lg:gap-y-12 lg:overflow-visible lg:px-0"
          >
            {data.categories.nodes.map((category, i) => (
              <li key={category.slug} className="snap-start">
                <CategoryPlate category={category} index={i} />
              </li>
            ))}
          </ul>
        </section>

        {/* Cuisines as a typographic index, with a plate that follows the pointer */}
        <section
          id="cuisines"
          aria-labelledby="cuisines-title"
          className="scroll-mt-24 border-y border-line bg-surface py-16 lg:py-24"
        >
          <div className="page">
            <SectionHeading
              id="cuisines-title"
              title="Cook your way around the world"
              intro={`${cuisines.length} cuisines, from Jamaican curry goat to Polish pierogi`}
              link="/recipes"
              linkLabel="Filter every cuisine"
            />
            <CuisineIndex cuisines={cuisines.slice(0, 24)} />
          </div>
        </section>

        {/* Short shopping lists: pinned, scroll-driven sideways row on large screens */}
        <section aria-labelledby="short-title">
          <HorizontalScroll
            label="Recipes with seven ingredients or fewer"
            heading={
              <SectionHeading
                id="short-title"
                title="Seven ingredients or fewer"
                intro="Short shopping lists for nights when you only want one stop at the shop"
                link="/recipes?max=7"
                linkLabel={`See all ${data.short.totalCount}`}
              />
            }
          >
            {/* No scroll reveal here: in the pinned row cards slide in sideways, and a fast
                scroll could otherwise skip their reveal and leave them blank. */}
            {data.short.nodes.map(recipe => (
              <li
                key={recipe.recipeId}
                className="w-64 shrink-0 snap-start sm:w-72 lg:w-[22rem]"
              >
                <RecipeCard recipe={recipe} sizes="352px" reveal={false} />
              </li>
            ))}
            <li className="w-64 shrink-0 snap-start sm:w-72 lg:w-[22rem]">
              <Link
                to="/recipes?max=7"
                className="group flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-herb/40 text-center transition-colors duration-300 hover:border-herb hover:bg-herb hover:text-surface"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-current transition-transform duration-500 group-hover:rotate-[-45deg]">
                  <Icon name="arrow" className="h-6 w-6" />
                </span>
                <span className="font-display text-display-sm">
                  See all {data.short.totalCount}
                </span>
                <span className="text-sm opacity-80">short-list recipes</span>
              </Link>
            </li>
          </HorizontalScroll>
        </section>

        {/* Soups and stews: the heading holds still while the cards scroll past */}
        <section
          aria-labelledby="warm-title"
          className="page grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16"
        >
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              id="warm-title"
              title="For cold evenings"
              intro="Soups, stews and slow pots that make the kitchen smell like dinner"
              link="/recipes?q=soup"
              linkLabel="More soups"
            />
          </div>
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2">
            {data.warm.nodes.map((recipe, i) => (
              <li
                key={recipe.recipeId}
                className={i % 2 ? "sm:translate-y-16" : ""}
              >
                <RecipeCard recipe={recipe} index={i % 2} />
              </li>
            ))}
          </ul>
        </section>

        {/* A breather before the footer: the cuisines, scrolling past */}
        <Marquee
          items={cuisines.slice(0, 12).map(c => c.name)}
          label="scrolling cuisine names"
        />

        <RecentlyViewed />
        <NewsletterSignup />
      </div>
    </Layout>
  )
}

export const Head = () => <Seo title="Recipes from around the world" />

export default IndexPage

export const query = graphql`
  query HomePage($featured: String = "") {
    all: allRecipe {
      totalCount
    }
    featured: recipe(slug: { eq: $featured }) {
      ...RecipeCard
    }
    latest: allRecipe(
      filter: { updatedAt: { ne: null } }
      sort: { updatedAt: DESC }
      limit: 80
    ) {
      nodes {
        ...RecipeCard
      }
    }
    categories: allCategory(sort: { recipeCount: DESC }) {
      nodes {
        name
        slug
        image
        recipeCount
      }
    }
    cuisines: allCuisine(sort: [{ recipeCount: DESC }, { name: ASC }]) {
      nodes {
        name
        recipeCount
        image
      }
    }
    short: allRecipe(
      filter: { ingredientCount: { lte: 7 } }
      sort: [{ updatedAt: DESC }, { name: ASC }]
      limit: 7
    ) {
      totalCount
      nodes {
        ...RecipeCard
      }
    }
    warm: allRecipe(
      filter: { tags: { in: ["Soup", "Stew", "Warming"] } }
      sort: { name: ASC }
      limit: 8
    ) {
      nodes {
        ...RecipeCard
      }
    }
  }
`
