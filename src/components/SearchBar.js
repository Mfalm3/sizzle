import React, { useState } from 'react'
import { motion } from 'motion/react'
import { s } from 'motion/react-client';

const SearchBar = () => {

  const [search, setSearch] = useState("");

  const suggestions = [
    "Pasta",
    "Salad",
    "Soup",
    "Dessert",
    "Grilled Chicken",
    "Vegetarian",
    "Vegan",
    "Gluten-Free"
  ];

  const handleSearch = (event) => {
    event.preventDefault();
    const query = event.target.elements.search.value;
    console.log("Searching for:", query);
    // Implement search functionality here
  }

  const handleSuggestionClick = (suggestion) => {
   setSearch(suggestion);
  }

  return (
    <div className="text-center space-y-10">

      <h4 className="text-xl font-semibold text-primary">What do you feel like cooking today?</h4>

      <div className='space-y-5'>
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0}}
          transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 100 }}
          >

          <input
            type="text"
            autoComplete='false'
            placeholder="Search for recipes..."
            className="w-1/2 form-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ml-2 btn">
            Search
          </button>
        </motion.div>

        <div className='flex gap-2 justify-center'>
          <p className='text-primary font-body'>Popular searches:</p>
          
          {suggestions.map((suggestion, index) => (
            <motion.span 
              key={index}
              className="text-accent font-body cursor-pointer hover:underline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSuggestionClick(suggestion)}
              transition={{ duration: 0.2 }}
            >
              {suggestion}
            </motion.span>
          ))}

        </div>
      </div>

    </div>
  )
}

export default SearchBar