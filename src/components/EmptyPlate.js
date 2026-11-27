import React from "react"

// An empty place setting seen from above (fork, plate, knife) for "nothing here yet" states.
// Drawn in the site's own colours, so empty states belong to the same table as the plated dishes.
const EmptyPlate = ({ className = "" }) => (
  <svg
    viewBox="0 0 240 160"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    {/* fork */}
    <g fill="none" stroke="#6B6356" strokeWidth="2.5" strokeLinecap="round">
      <path d="M26 30v24M34 30v24M42 30v24" />
      <path d="M26 54c0 9 16 9 16 0" />
      <path d="M34 62v68" />
    </g>
    {/* plate: rim, then the well, with a soft shadow underneath */}
    <ellipse cx="120" cy="138" rx="56" ry="8" fill="#24211C" opacity="0.06" />
    <circle
      cx="120"
      cy="80"
      r="62"
      fill="#FFFCF6"
      stroke="#E3D9C7"
      strokeWidth="2"
    />
    <circle
      cx="120"
      cy="80"
      r="44"
      fill="#F4EEE2"
      stroke="#E3D9C7"
      strokeWidth="1.5"
    />
    <circle cx="120" cy="80" r="5" fill="#D99A1E" opacity="0.8" />
    {/* knife */}
    <g
      fill="none"
      stroke="#6B6356"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M206 30c9 8 9 30 0 40" />
      <path d="M206 30v100" />
    </g>
  </svg>
)

export default EmptyPlate
