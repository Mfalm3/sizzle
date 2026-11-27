import React from "react"
import { Link, graphql } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SplitText from "../components/motion/SplitText"
import { reveal } from "../lib/reveal"

const AboutPage = ({ data }) => (
  <Layout>
    <article className="page grid gap-12 pb-8 pt-8 lg:grid-cols-[1fr_22rem] lg:gap-20 lg:pt-14">
      <div className="max-w-prose">
        <SplitText
          as="h1"
          text="A recipe box for people who actually cook"
          className="text-display-lg"
        />
        <div
          ref={reveal}
          data-reveal="up"
          style={{ "--i": 6 }}
          className="mt-8 space-y-5 text-lg leading-relaxed"
        >
          <p>
            Sizzle collects {data.allRecipe.totalCount} home recipes from{" "}
            {data.cuisines.distinct.length} cuisines and puts them in a format
            that works at the stove: a shopping list you can scale, a method
            with numbered steps, and timers you can start straight from the step
            that needs them.
          </p>
          <p>
            The recipes and photographs come from{" "}
            <a className="link" href="https://www.themealdb.com">
              TheMealDB
            </a>
            , an open, crowd-sourced recipe database. Each recipe links back to
            its original source where one is known.
          </p>
          <h2 className="pt-6 text-display-md">What you can do here</h2>
          <ul className="list-disc space-y-2 pl-5 marker:text-saffron">
            <li>
              Search by dish, or by ingredients you already have, such as
              “chickpeas spinach”
            </li>
            <li>
              Filter by category, cuisine, shopping-list length or whether
              there's a video
            </li>
            <li>
              Halve, double or triple any shopping list, and tick ingredients
              off as you gather them
            </li>
            <li>Start a timer from any step that mentions a cooking time</li>
            <li>
              Save recipes and come back to the ones you viewed recently. Both
              stay on your device; nothing is sent to us
            </li>
            <li>Print a clean copy of any recipe for the kitchen</li>
          </ul>
          <h2 className="pt-6 text-display-md">What's coming</h2>
          <p>
            Accounts so your saved recipes follow you between devices, recipe
            collections, meal planning and shopping lists. Until then,
            everything works without signing in.
          </p>
        </div>
        <Link to="/recipes" className="btn-primary mt-10">
          Find a recipe
        </Link>
      </div>
      <div
        ref={reveal}
        data-reveal="plate"
        className="mx-auto w-64 self-start lg:sticky lg:top-28 lg:mt-24 lg:w-full"
      >
        <div className="relative aspect-square w-full animate-[float_6s_ease-in-out_infinite] motion-reduce:animate-none">
          {/* Three of the site's own category dishes, plated and overlapping on the table */}
          {data.plates.nodes.map((plate, i) => (
            <span
              key={plate.name}
              className={`plate absolute flex items-center justify-center ${
                [
                  "left-0 top-0 w-[68%]",
                  "bottom-[4%] right-0 w-[52%]",
                  "right-[6%] top-[2%] w-[34%]",
                ][i]
              }`}
              style={{ aspectRatio: "1" }}
            >
              <img
                src={plate.image}
                alt=""
                width="320"
                height="200"
                loading="lazy"
                decoding="async"
                className="w-[78%]"
              />
            </span>
          ))}
        </div>
      </div>
    </article>
  </Layout>
)

export const Head = () => <Seo title="About" />

export default AboutPage

export const query = graphql`
  query AboutPage {
    allRecipe {
      totalCount
    }
    cuisines: allRecipe(filter: { cuisine: { ne: null } }) {
      distinct(field: { cuisine: SELECT })
    }
    plates: allCategory(sort: { recipeCount: DESC }, limit: 3) {
      nodes {
        name
        image
      }
    }
  }
`
