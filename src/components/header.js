import React, { useState } from "react"
import { Link } from "gatsby"
import { motion, useScroll, useMotionValueEvent } from "motion/react"
import Icon from "./Icon"
import Drawer from "./Drawer"
import SearchForm from "./SearchForm"
import Magnetic from "./motion/Magnetic"
import { SAVED, useStoredList } from "../lib/storage"
import { ease } from "../lib/motion"

const NAV = [
  { to: "/recipes", label: "Recipes" },
  { to: "/#categories", label: "Categories" },
  { to: "/#cuisines", label: "Cuisines" },
  { to: "/about", label: "About" },
]

export const Logo = ({ siteTitle }) => (
  <Link
    to="/"
    className="group flex items-center gap-2.5 font-display text-2xl leading-none"
  >
    <svg
      viewBox="0 0 32 32"
      className="h-8 w-8 transition-transform duration-700 ease-out group-hover:rotate-[200deg]"
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="15" fill="#2F4B33" />
      <circle cx="16" cy="16" r="10" fill="#FFFCF6" />
      <circle cx="16" cy="16" r="5.5" fill="#D99A1E" />
      <circle cx="16" cy="9" r="1.6" fill="#2F4B33" />
    </svg>
    {siteTitle}
  </Link>
)

// Sticky header that slides away while scrolling down and returns on the way up
// (or as soon as anything inside it takes keyboard focus).
const Header = ({ siteTitle, showSearch = true }) => {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  // false, "menu" or "search": opening from the search button focuses the search box
  const [menuOpen, setMenuOpen] = useState(false)
  const savedCount = useStoredList(SAVED).length
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", y => {
    setScrolled(y > 8)
    setHidden(y > 240 && y > scrollY.getPrevious())
  })

  return (
    <motion.header
      data-noprint
      animate={{ y: hidden && !menuOpen ? "-100%" : 0 }}
      transition={{ duration: 0.4, ease }}
      onFocusCapture={() => setHidden(false)}
      className={`sticky top-0 z-40 border-b bg-paper/90 backdrop-blur transition-colors duration-300 ${
        scrolled ? "border-line" : "border-transparent"
      }`}
    >
      <a
        href="#main"
        className="btn-primary absolute left-4 top-2 -translate-y-20 focus:translate-y-0"
      >
        Skip to content
      </a>
      <div className="page flex h-16 items-center gap-6 sm:h-[4.5rem]">
        <Logo siteTitle={siteTitle} />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex gap-5">
            {NAV.map(item => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="nav-link py-1 text-sm font-medium text-muted hover:text-ink"
                  activeClassName="!text-ink"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {showSearch && (
            <div className="hidden w-72 lg:block">
              <SearchForm id="header-search" size="sm" />
            </div>
          )}
          {/* Below lg the header has no search field; this opens the menu, whose search box takes focus first. */}
          <button
            type="button"
            className="btn-icon lg:hidden"
            aria-label="Search recipes"
            onClick={() => setMenuOpen("search")}
          >
            <Icon name="search" />
          </button>
          <Magnetic strength={0.4}>
            <Link
              to="/saved"
              className="btn-icon relative"
              aria-label={`Saved recipes (${savedCount})`}
            >
              <Icon
                name="heart"
                filled={savedCount > 0}
                className={`h-5 w-5 ${savedCount ? "text-saffron-deep" : ""}`}
              />
              {savedCount > 0 && (
                <motion.span
                  key={savedCount}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-herb px-1 text-xs font-semibold text-surface"
                >
                  {savedCount}
                </motion.span>
              )}
            </Link>
          </Magnetic>
          <button
            type="button"
            className="btn-icon md:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen === "menu"}
            onClick={() => setMenuOpen("menu")}
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>

      <Drawer
        open={Boolean(menuOpen)}
        onClose={() => setMenuOpen(false)}
        title="Menu"
      >
        <SearchForm
          id="menu-search"
          size="sm"
          autoFocus={menuOpen === "search"}
          onSubmitted={() => setMenuOpen(false)}
        />
        <nav aria-label="Mobile" className="mt-6">
          <ul className="border-t border-line">
            {[...NAV, { to: "/saved", label: "Saved recipes" }].map(
              (item, i) => (
                <motion.li
                  key={item.to}
                  className="overflow-hidden border-b border-line"
                  initial={{ opacity: 0, x: 48 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease, delay: 0.15 + i * 0.06 }}
                >
                  <Link
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className="block py-4 font-display text-display-md"
                  >
                    {item.label}
                  </Link>
                </motion.li>
              )
            )}
          </ul>
        </nav>
      </Drawer>
    </motion.header>
  )
}

export default Header
