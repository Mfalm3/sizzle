import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

function Seo({ description, title, image, noindex = false, children }) {
  const { site } = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `)

  const metaDescription = description || site.siteMetadata.description
  const siteTitle = site.siteMetadata.title
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="theme-color" content="#F4EEE2" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
      <meta
        name="twitter:card"
        content={image ? "summary_large_image" : "summary"}
      />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {noindex && <meta name="robots" content="noindex" />}
      {children}
    </>
  )
}

export default Seo
