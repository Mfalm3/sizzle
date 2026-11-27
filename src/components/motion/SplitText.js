import React from "react"
import { reveal } from "../../lib/reveal"

// Splits a heading into masked words (or letters) that rise in, one after another, when the
// heading scrolls into view. Screen readers get the plain sentence; the split copy is hidden.
const SplitText = ({
  as: Tag = "span",
  text,
  by = "word",
  className = "",
  delay = 0,
  ...rest
}) => {
  const parts = by === "char" ? [...text] : text.split(" ")

  return (
    <Tag ref={reveal} data-reveal="split" className={className} {...rest}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            <span className="split-mask">
              <span className="split-part" style={{ "--i": i + delay }}>
                {part === " " ? " " : part}
              </span>
            </span>
            {by === "word" && i < parts.length - 1 && " "}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  )
}

export default SplitText
