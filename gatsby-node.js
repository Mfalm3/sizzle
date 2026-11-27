/**
 * Sources TheMealDB data (cached in src/_data) as Recipe and Category nodes,
 * then creates a page per recipe and per category.
 */
const fetchAndCache = require("./utils/fetchAndCache")
const { normalizeMeal, normalizeCategory } = require("./utils/recipes")

const API = "https://www.themealdb.com/api/json/v1/1"
// The free API has no "list everything" call, so we pull every first letter.
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("")

exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type Ingredient {
      name: String!
      measure: String
    }
    type MethodSection {
      title: String
      steps: [String!]!
    }
    type Recipe implements Node @dontInfer {
      recipeId: String!
      slug: String!
      name: String!
      category: String!
      categorySlug: String!
      cuisine: String
      tags: [String!]!
      image: String!
      method: [MethodSection!]!
      ingredients: [Ingredient!]!
      ingredientNames: [String!]!
      ingredientCount: Int!
      stepCount: Int!
      youtube: String
      source: String
      updatedAt: Date @dateformat
    }
    type Cuisine implements Node @dontInfer {
      name: String!
      recipeCount: Int!
      image: String!
    }
    type Category implements Node @dontInfer {
      name: String!
      slug: String!
      image: String!
      description: String!
      recipeCount: Int!
    }
  `)
}

exports.sourceNodes = async ({
  actions,
  createNodeId,
  createContentDigest,
}) => {
  const { createNode } = actions

  const areas = await fetchAndCache(`${API}/list.php?a=list`, "areas.json")
  const categories = await fetchAndCache(
    `${API}/categories.php`,
    "categories.json"
  )
  // One request at a time: the free API drops connections when hit with ~30 at once.
  const letters = []
  for (const l of LETTERS) {
    letters.push(
      await fetchAndCache(`${API}/search.php?f=${l}`, `meals/${l}.json`)
    )
  }

  const areaByCountry = Object.fromEntries(
    areas.meals.map(a => [a.strCountry, a.strArea])
  )
  const recipes = letters
    .flatMap(l => l.meals || [])
    .map(m => normalizeMeal(m, areaByCountry))

  const seen = new Set()
  recipes.forEach(recipe => {
    if (seen.has(recipe.slug)) recipe.slug = `${recipe.slug}-${recipe.recipeId}`
    seen.add(recipe.slug)
    createNode({
      ...recipe,
      id: createNodeId(`recipe-${recipe.recipeId}`),
      internal: { type: "Recipe", contentDigest: createContentDigest(recipe) },
    })
  })

  const byCuisine = {}
  recipes.forEach(
    r =>
      r.cuisine && (byCuisine[r.cuisine] = byCuisine[r.cuisine] || []).push(r)
  )
  Object.entries(byCuisine).forEach(([name, list]) => {
    // A stand-in photo for the cuisine: its first recipe alphabetically.
    const [first] = [...list].sort((a, b) => a.name.localeCompare(b.name))
    const cuisine = { name, recipeCount: list.length, image: first.image }
    createNode({
      ...cuisine,
      id: createNodeId(`cuisine-${name}`),
      internal: {
        type: "Cuisine",
        contentDigest: createContentDigest(cuisine),
      },
    })
  })

  categories.categories.forEach(raw => {
    const count = recipes.filter(r => r.category === raw.strCategory).length
    const category = normalizeCategory(raw, count)
    createNode({
      ...category,
      id: createNodeId(`category-${category.slug}`),
      internal: {
        type: "Category",
        contentDigest: createContentDigest(category),
      },
    })
  })
}

// The home page query can't read siteMetadata as a variable, so hand it the hero slug as context.
exports.onCreatePage = ({ page, actions }) => {
  if (page.path !== "/") return
  const { featuredRecipe } = require("./gatsby-config").siteMetadata
  actions.deletePage(page)
  actions.createPage({
    ...page,
    context: { ...page.context, featured: featuredRecipe || "" },
  })
}

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { data, errors } = await graphql(`
    {
      allRecipe {
        nodes {
          id
          slug
          categorySlug
        }
      }
      allCategory {
        nodes {
          id
          slug
          name
        }
      }
    }
  `)
  if (errors) {
    reporter.panicOnBuild("Could not load recipes for page creation", errors)
    return
  }

  data.allRecipe.nodes.forEach(recipe => {
    actions.createPage({
      path: `/recipes/${recipe.slug}`,
      component: require.resolve("./src/templates/recipe.js"),
      context: { id: recipe.id, categorySlug: recipe.categorySlug },
    })
  })

  data.allCategory.nodes.forEach(category => {
    actions.createPage({
      path: `/category/${category.slug}`,
      component: require.resolve("./src/templates/category.js"),
      context: { id: category.id, name: category.name },
    })
  })
}
