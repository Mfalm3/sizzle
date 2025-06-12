import React from 'react'
import { motion } from 'motion/react'

const Card = ({ category, setSelectedCategory }) => {
  
  

  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    
    <motion.div 
      layoutId={`category-card-${category.id}`}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ scale: 1.05 }}
      onClick={() => setSelectedCategory(category)}
      className='h-auto w-auto rounded-md shadow-md overflow-hidden hover:shadow-lg transition-colors duration-300'
    >
      <motion.div 
        layout={`image-container-${category.id}`}
        className='overflow-hidden'
        >
          <motion.img
            layoutId={`image-${category.id}`}
            src={category.image}
            alt={category.name}
            className='h-44 w-full rounded-t-md object-cover'
            initial={{ opacity: 0, rotateY: 360, scaleY: 0.8 }}
            animate={{ opacity: 1, rotateY: 0, scaleY: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5 }}
          />
        </motion.div>

      <motion.div
        layoutId={`content-${category.id}`}
        className='p-4 bg-white rounded-b-md select-none'
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h3 
          layoutId={`title-${category.id}`}
          className='text-primary text-lg font-semibold font-heading'
        >
          {category.name}
        </motion.h3>
        <p className='text-sm text-primary line-clamp-2 font-body'>{category.description}</p>
      </motion.div>
    </motion.div>
  )
}

export default Card