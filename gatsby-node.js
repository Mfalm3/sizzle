/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */

/**
 * @type {import('gatsby').GatsbyNode['createPages']}
 */
const { lowerCase } = require("lodash");

exports.createPages = async ({ actions }) => {
  const { createPage } = actions
  createPage({
    path: "/using-dsg",
    component: require.resolve("./src/templates/using-dsg.js"),
    context: {},
    defer: true,
  })


  const fetchAndCache = require("./utils/fetchAndCache");
  const categories = await fetchAndCache("https://www.themealdb.com/api/json/v1/1/categories.php", "categories.json");
  categories.categories.forEach(category => {
    createPage({
      path: `/category/${lowerCase(category.strCategory)}`,
      component: require.resolve("./src/templates/category.js"),
      context: {
        category: category,
        categoryId: category.idCategory
      }
    })
  });




}
