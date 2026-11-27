import React from "react"
import { Link } from "gatsby"

import Layout from "../components/layout"
import Seo from "../components/seo"
import SplitText from "../components/motion/SplitText"

const Section = ({ title, children }) => (
  <section className="mt-10">
    <h2 className="text-display-sm">{title}</h2>
    <div className="mt-3 space-y-3">{children}</div>
  </section>
)

// Plain-language account of what Sizzle stores and where. Keep it in step with the code:
// anything new that leaves the browser or is stored belongs here.
const PrivacyPage = () => (
  <Layout>
    <article className="page max-w-prose pb-8 pt-8 lg:pt-12">
      <SplitText as="h1" text="Privacy" className="text-display-lg" />
      <p className="mt-3 text-muted">Last updated 27 November 2026</p>

      <div className="text-lg leading-relaxed">
        <Section title="What stays on your device">
          <p>
            Saved recipes, recently viewed recipes, the servings you choose,
            your food log and any calorie target are stored in your browser's
            local storage. Running cooking timers are kept in session storage
            until you close the tab. None of this is sent to Sizzle, and
            clearing your browser's site data removes it.
          </p>
        </Section>

        <Section title="The newsletter">
          <p>
            If you sign up, your email address and your IP address are sent to
            Buttondown, the service that runs the newsletter. The IP address
            helps it block spam sign-ups. You'll get an email asking you to
            confirm, and you're only subscribed once you do.
          </p>
          <p>
            Every newsletter includes a link to unsubscribe. Subscriber
            addresses are never shown on this site or shared with anyone else.
          </p>
        </Section>

        <Section title="Services the site loads from">
          <p>
            The site is hosted on Netlify. Recipe photos load from TheMealDB,
            and fonts load from Google Fonts, so your browser connects to those
            services and they see your IP address, as with any website that uses
            them.
          </p>
          <p>
            The site sets no tracking cookies and includes no advertising or
            analytics scripts.
          </p>
        </Section>

        <Section title="Nutrition and the food log">
          <p>
            Nutrition figures are estimates from USDA data and the recipe's
            stated amounts. They are general information, not medical or dietary
            advice.
          </p>
        </Section>

        <Section title="Questions">
          <p>
            Open an issue on the{" "}
            <a
              className="link font-normal"
              href="https://github.com/Mfalm3/sizzle/issues"
            >
              project's GitHub page
            </a>
            , or read more{" "}
            <Link to="/about" className="link font-normal">
              about Sizzle
            </Link>
            .
          </p>
        </Section>
      </div>
    </article>
  </Layout>
)

export const Head = () => (
  <Seo
    title="Privacy"
    description="What Sizzle stores, where, and what's shared with the services it uses."
  />
)

export default PrivacyPage
