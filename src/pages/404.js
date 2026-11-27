import * as React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SplitText from "../components/motion/SplitText"
import SearchForm from "../components/SearchForm"

const NotFoundPage = () => (
  <Layout showSearch={false}>
    <section className="page flex flex-col items-center py-20 text-center lg:py-28">
      <div className="plate flex aspect-square w-40 animate-[wobble_3s_ease-in-out_infinite] items-center justify-center motion-reduce:animate-none">
        <span className="font-display text-display-md text-muted">404</span>
      </div>
      <SplitText
        as="h1"
        text="This plate is empty"
        className="mt-10 text-display-lg"
      />
      <p className="mt-4 max-w-md text-lg text-muted">
        The page you followed doesn't exist, or the recipe has moved. Search for
        it instead.
      </p>
      <div className="mt-8 w-full max-w-lg">
        <SearchForm id="notfound-search" />
      </div>
      <Link to="/" className="link mt-6">
        Back to the homepage
      </Link>
    </section>
  </Layout>
)

export const Head = () => <Seo title="Page not found" noindex />

export default NotFoundPage
