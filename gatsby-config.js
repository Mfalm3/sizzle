/**
 * @type {import('gatsby').GatsbyConfig}
 */
const path = require("path")

module.exports = {
  siteMetadata: {
    title: `Sizzle`,
    description: `Hundreds of home recipes from around the world, with ingredient scaling, cooking timers and a print-ready method.`,
    author: `Mfalm3`,
    // Set to a provider's form endpoint (Buttondown, Mailchimp, ConvertKit...) to show the newsletter form.
    newsletterAction: ``,
    social: [`https://github.com/mfalm3`],
    // Slug of the dish plated in the home page hero. Leave empty to show the latest update.
    featuredRecipe: `jamaican-curry-goat`,
  },
  plugins: [
    `gatsby-plugin-image`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: path.join(__dirname, `src`, `images`),
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Sizzle`,
        short_name: `Sizzle`,
        start_url: `/`,
        background_color: `#F4EEE2`,
        theme_color: `#2F4B33`,
        display: `minimal-ui`,
        icon: `src/images/icon.png`,
      },
    },
    `gatsby-plugin-preload-fonts`,
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [`young serif\:400`, `figtree\:400,500,600,700`],
        display: "swap",
      },
    },
  ],
}
