import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

import Header from "./header"
import Footer from "./footer"
// import "./layout.css"
import BgImage from "../images/concrete-bg.jpg"

const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header siteTitle={data.site.siteMetadata?.title || `Title`} />

      <main
        className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center bg-background"
        style={{
          // backgroundImage: `url(${BgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >{children}</main>

      <Footer />
    </>
  )
}

export default Layout
