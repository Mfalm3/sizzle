import React from "react"
import { Link, graphql, useStaticQuery } from "gatsby"
import { SocialIcon } from "react-social-icons/component"
// The /component build ships no icons; register each network listed in siteMetadata.social.
import "react-social-icons/github"
import { Logo } from "./header"
import SplitText from "./motion/SplitText"
import NewsletterSignup from "./NewsletterSignup"

const FooterLink = ({ to, children }) => (
  <Link className="nav-link hover:text-surface" to={to}>
    {children}
  </Link>
)

const Footer = () => {
  const { site, allCategory } = useStaticQuery(graphql`
    query FooterQuery {
      site {
        siteMetadata {
          title
          social
        }
      }
      allCategory(sort: { recipeCount: DESC }) {
        nodes {
          name
          slug
        }
      }
    }
  `)
  const { title, social } = site.siteMetadata

  return (
    <footer
      data-noprint
      className="mt-24 overflow-hidden bg-herb-dark text-surface/80"
    >
      <div className="page grid gap-12 py-16 md:grid-cols-[1.2fr_2fr]">
        <div className="max-w-sm space-y-4">
          <div className="text-surface [&_circle:nth-child(1)]:fill-surface/10">
            <Logo siteTitle={title} />
          </div>
          <p>
            Home cooking from kitchens all over the world, written down so you
            can make it tonight
          </p>
          {social.length > 0 && (
            <div className="flex gap-2">
              {social.map(url => (
                <SocialIcon
                  key={url}
                  url={url}
                  bgColor="transparent"
                  fgColor="currentColor"
                  className="touch-target !h-10 !w-10 rounded-full ring-1 ring-surface/25 transition hover:-translate-y-0.5 hover:ring-surface/60"
                />
              ))}
            </div>
          )}
          <div className="pt-4">
            <NewsletterSignup variant="compact" />
          </div>
        </div>

        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <h2 className="font-sans text-sm font-semibold text-surface">
              Explore
            </h2>
            <ul className="mt-4 space-y-2.5">
              <li>
                <FooterLink to="/recipes">All recipes</FooterLink>
              </li>
              <li>
                <FooterLink to="/recipes?sort=updated">
                  Recently updated
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/recipes?max=7">
                  Short shopping lists
                </FooterLink>
              </li>
              <li>
                <FooterLink to="/saved">Saved recipes</FooterLink>
              </li>
              <li>
                <FooterLink to="/about">About {title}</FooterLink>
              </li>
            </ul>
          </div>
          <div className="sm:col-span-2">
            <h2 className="font-sans text-sm font-semibold text-surface">
              Categories
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {allCategory.nodes.map(category => (
                <li key={category.slug}>
                  <FooterLink to={`/category/${category.slug}`}>
                    {category.name}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* The sign-off: a giant wordmark whose letters rise in, and sizzle when hovered */}
      <div aria-hidden="true" className="page select-none overflow-hidden">
        <SplitText
          as="p"
          by="char"
          text={title}
          className="wordmark -mb-[0.1em] cursor-default text-center font-display text-[clamp(6rem,27vw,24rem)] leading-[0.9] tracking-tight text-surface"
        />
      </div>

      <div className="relative border-t border-surface/15">
        <div className="page flex flex-col gap-2 py-6 text-sm sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {title}. Recipes and photos from{" "}
            <a
              className="underline underline-offset-4 hover:text-surface"
              href="https://www.themealdb.com"
            >
              TheMealDB
            </a>
            .
          </p>
          <p className="flex gap-4">
            <Link
              className="underline underline-offset-4 hover:text-surface"
              to="/privacy"
            >
              Privacy
            </Link>
            <span>
              Made by{" "}
              <a
                className="underline underline-offset-4 hover:text-surface"
                href="https://github.com/mfalm3"
              >
                Mfalm3
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
