import React, { useState } from 'react'
import { useStaticQuery, graphql, navigate } from 'gatsby'
import { map, lowerCase } from 'lodash'
import { motion, AnimatePresence } from 'motion/react'
import { Link } from 'gatsby'

import Card from '../recipe/Card'

const CategoriesListing = () => {

  const [selectedCategory, setSelectedCategory] = useState(null)

  const data = useStaticQuery(graphql`
    query CategoryListQuery {
      allDataJson {
        edges {
          node {
            categories {
              idCategory
              strCategory
              strCategoryDescription
              strCategoryThumb
            }
          }
        }
      }
  }
`)

const categoriesData = data.allDataJson.edges[0].node.categories;

const categories = map(categoriesData, (node) => ({
  id: node.idCategory,
  name: node.strCategory,
  image: node.strCategoryThumb,
  description: node.strCategoryDescription
}));

// Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode='popLayout'>
        <motion.div 
          layout
          className="pt-20 w-full gap-10 grid grid-cols-4">
          { categories.map((category) => (
            <Card category={category} key={category.id} setSelectedCategory={setSelectedCategory}/>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Backdrop Overlay */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setSelectedCategory(null)}
          />
        )}
      </AnimatePresence>


        {/* Expanded Card */}
        <AnimatePresence>
          {selectedCategory && (
            <motion.div
              layoutId={`category-card-${selectedCategory.id}`}
              className="fixed inset-0 z-50 [&>div]:z-50 flex items-center justify-center pt-24 p-4 pointer-events-none"
            >
              <motion.div
                className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div 
                  layoutId={`image-container-${selectedCategory.id}`}
                  className="relative h-64 overflow-hidden"
                >
                  <motion.img
                    layoutId={`image-${selectedCategory.id}`}
                    src={selectedCategory.image}
                    alt={selectedCategory.name}
                    className="w-full h-full object-cover"
                  />
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => setSelectedCategory(null)}
                    className="absolute top-4 right-4 w-10 h-10 cursor-pointer text-accent hover:text-primary bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200"
                  >
                    ✕
                  </motion.button>
                </motion.div>
                
                <motion.div 
                  layoutId={`content-${selectedCategory.id}`}
                  className="p-8"
                >
                  <motion.h2 
                    layoutId={`title-${selectedCategory.id}`}
                    className="text-3xl font-bold text-gray-900 mb-4"
                  >
                    {selectedCategory.name}
                  </motion.h2>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-primary font-body h-40 overflow-y-auto leading-relaxed text-lg"
                  >
                    {selectedCategory.description}
                  </motion.p>
                  <Link 
                    to={`/category/${lowerCase(selectedCategory.name)}`} 
                    className='inline-block text-accent text-sm cursor-pointer'
                    onClick={(e) => e.stopPropagation()}
                  >
                    Read more...
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  )
}


export default CategoriesListing