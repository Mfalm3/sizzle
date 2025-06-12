import * as React from "react"
import { motion, useScroll, useMotionValueEvent } from "motion/react"

const headerVariants = {
  initial: {    
    top: 0,
    left: 0,
    right: 0,
    boxShadow: "none",
    borderRadius: "0",
    backdropFilter: "none",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
  scrolled: {
    top: 20,
    left: 40,
    right: 40,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
}


const Header = ({ siteTitle }) => {
  
  const { scrollY } = useScroll()
  const [variant, setVariant] = React.useState("initial")

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVariant(latest > 30 ? "scrolled" : "initial")
  })


  return (
  <motion.header 
    variants={headerVariants}
    animate={variant}
    initial="initial"
    transition={{
        layout: { duration: 0.3, ease: "easeInOut" },
        duration: 0.3,
        ease: "easeInOut",
      }}
    layout
    className="fixed z-50 top-5 inset-x-5 px-10 rounded bg-gray-50 text-slate dark:bg-gray-800 dark:text-white p-4"
  >
    <ul>
      <li>
        <h1 className="text-2xl font-bold text-primary font-heading">Recipes</h1>
      </li>
    </ul>
  </motion.header>
  )
}

export default Header
