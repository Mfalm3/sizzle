import React from "react"
import { motion } from "motion/react"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SearchBar from "../components/SearchBar"
import NewsletterSignup from "../components/NewsletterSignup"
import FoodiesGirl from "../images/Foodies - Girl Cooking.png"
import CategoriesListing from "../components/Home/CategoriesListing"


const IndexPage = () => {

return (

  <Layout>
    <div className="w-full pt-32">

      {/* 'Hero Section' */}
      <div className="px-10 space-y-20 relative isolate">
        <motion.div 
          className="text-center space-y-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold text-primary font-heading">Welcome to Recipe World</h1>
          <p className="text-primary font-body">Discover easy, delicious recipes for every occasion — no matter your skill level.</p>

          <img src={FoodiesGirl} alt="Food" className="z-[-1] h-[280px] select-none rounded-lg absolute rotate-[-20deg] translate-y-[-100px]" />
        </motion.div>

        {/* Search Bar */}
        <SearchBar />


        {/* Categories Grid */}
        <CategoriesListing />

        {/* Featured Recipes */}


        {/* Newsletter Signup */}
        <NewsletterSignup />

      </div>
    </div>
  </Layout>
  )
}

export const Head = () => <Seo title="Home" />

export default IndexPage
