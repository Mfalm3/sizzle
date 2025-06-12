import React from 'react'
import { AnimatePresence } from "motion/react";
import "./src/styles/global.css"


export const wrapRootElement = ({ element }) => {
  return (
    <AnimatePresence
      initial={false}
      mode="wait"
      onExitComplete={() => window.scrollTo(0, 0)}
    >
      {element}
    </AnimatePresence>
  )
}