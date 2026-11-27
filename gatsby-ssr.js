const React = require("react")
const { wrapRootElement, wrapPageElement } = require("./gatsby-browser")

// Scroll reveals only hide content once we know JavaScript is running ("js" class, set before
// first paint). If the app hasn't hydrated within 5s, drop the class so nothing stays hidden.
const revealGate = `
document.documentElement.classList.add("js");
setTimeout(function () { if (!window.__sizzleHydrated) document.documentElement.classList.remove("js") }, 5000);
`

exports.onRenderBody = ({ setHtmlAttributes, setHeadComponents }) => {
  setHtmlAttributes({ lang: `en` })
  setHeadComponents([
    <script
      key="reveal-gate"
      dangerouslySetInnerHTML={{ __html: revealGate }}
    />,
  ])
}

exports.wrapRootElement = wrapRootElement
exports.wrapPageElement = wrapPageElement
