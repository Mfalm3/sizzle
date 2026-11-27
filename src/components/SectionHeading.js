import React from "react"
import { Link } from "gatsby"
import SplitText from "./motion/SplitText"
import Magnetic from "./motion/Magnetic"
import Icon from "./Icon"
import { reveal } from "../lib/reveal"

// Section title that rises in word by word, an optional intro and a "see all" link.
const SectionHeading = ({ title, intro, link, linkLabel, id }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
    <div className="max-w-prose">
      <SplitText as="h2" id={id} text={title} className="text-display-md" />
      {intro && (
        <p
          ref={reveal}
          data-reveal="up"
          style={{ "--i": 3 }}
          className="mt-2 text-muted"
        >
          {intro}
        </p>
      )}
    </div>
    {link && (
      <Magnetic>
        <Link
          to={link}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-herb"
        >
          <span className="nav-link">{linkLabel}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-herb/30 transition-colors duration-300 group-hover:bg-herb group-hover:text-surface">
            <Icon
              name="arrow"
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
            />
          </span>
        </Link>
      </Magnetic>
    )}
  </div>
)

export default SectionHeading
