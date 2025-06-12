import React from 'react'
import { motion } from 'motion/react'
import { Link } from 'gatsby'
import { lowerCase, mapValues } from 'lodash'
import Layout from '../components/layout'

const Category = ({ pageContext }) => {

  const { category } = mapValues(pageContext, (node) => ({
      'id': node?.idCategory || '',
      'name': node?.strCategory || '',
      'image': node?.strCategoryThumb || null,
      'description': node?.strCategoryDescription
    })
  )

  console.log("Category page context:", pageContext)
  console.log("Category:", category)

  const slug = lowerCase(category.name)

  return (
    <Layout>
      <motion.div className="p-8">
      <Link to="/">← Back</Link>

      <motion.div
        className="rounded-lg overflow-hidden shadow-xl my-8"
        layoutId={`category-card-${slug}`}
        layout
        transition={{ duration: 1 }}
      >
        <img src={category.image} alt={slug} />
        <div className="p-6 bg-white">
          <h1 className="text-4xl font-heading text-primary capitalize">{slug}</h1>
          <p className='font-body text-primary'>{category.description}</p>
        </div>
      </motion.div>
    </motion.div>
    </Layout>
  )
}

export default Category