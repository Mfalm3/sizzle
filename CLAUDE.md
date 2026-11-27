# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sizzle: a Gatsby 5 + React 18 recipe site styled with Tailwind 3 and animated with `motion` (imported from `motion/react`). All recipe content comes from the free TheMealDB API, cached in `src/_data`. There is no backend: saved and recently viewed recipes live in `localStorage`. The README is still the unmodified Gatsby starter README.

## Commands

- `npm run develop`: dev server at http://localhost:8000 (GraphiQL at `/___graphql`)
- `npm run build` / `npm run serve`: production build into `public/`, served on :9000
- `npm test`: Node's built-in runner over `src/lib/*.test.mjs` (no Jest). Run one test with `node --test --test-name-pattern="scales measures" src/lib/lib.test.mjs`
- `npm run clean`: clear `.cache/` and `public/`
- `npm run format`: Prettier (`semi: false`, `arrowParens: "avoid"`)
- `npm run format:check`: the same check CI runs

## CI

`.github/workflows/ci.yml` runs on PRs into and pushes to `main` and `develop` (feature branches are `ft-*`, branched from and merged back into `develop`), in two parallel jobs: **checks** (`format:check`, `npm test`, `npm audit --omit=dev --audit-level=critical`) and **build** (`npm run build`, then fails if the build had to fetch recipe data that isn't committed in `src/_data`). Node comes from `.nvmrc`. Installs set `PUPPETEER_SKIP_DOWNLOAD`, because `gatsby-plugin-preload-fonts` pulls in Puppeteer 3, whose Chromium download is slow and flaky; set it locally too if `npm ci` stalls there. The audit gate is `critical`, not `high`: the remaining high advisories all come through Gatsby 5 and have no fix short of leaving Gatsby. Don't run `npm audit fix --omit=dev`: it also removes dev dependencies such as `tailwindcss` from `node_modules`. Dependabot (`.github/dependabot.yml`) opens weekly npm PRs (Gatsby packages grouped) and monthly Actions updates.

## Data flow (build time)

1. `gatsby-node.js` `sourceNodes` calls `utils/fetchAndCache.js` for the area list, categories and `search.php?f=<letter>` for a–z. Each response is cached to `src/_data/` (`meals/<letter>.json`) and reused forever after; delete a file to refresh it. Fetches run one at a time because the API drops connections under ~30 parallel requests.
2. `utils/recipes.js` normalizes raw meals: `cuisine` comes from mapping `strCountry` through the area list (`strArea` is null for ~25% of meals), and `splitMethod` turns free-text instructions into `method: [{ title, steps }]`, stripping source numbering and dropping "Instructions"/"Equipment" labels. Its behaviour is covered in `src/lib/lib.test.mjs`.
3. Explicit GraphQL types (`Recipe`, `Category`, `MethodSection`, `Ingredient`) are declared with `@dontInfer` in `createSchemaCustomization`; add fields there and in `normalizeMeal` together.
4. `createPages` makes `/recipes/<slug>` (`src/templates/recipe.js`) and `/category/<slug>` (`src/templates/category.js`). Slugs are lodash `kebabCase`; collisions get `-<idMeal>` appended.

TheMealDB has no prep/cook times, servings, difficulty, ratings or nutrition. Don't build UI that implies them; batch scaling is a multiplier (½×–3×) because servings are unknown.

## Front end

- `src/lib/` holds framework-free logic (quantity scaling, timer detection, search/filter/sort, localStorage store), and `src/components/` the UI. `RecipeCard.js` exports the `RecipeCard` GraphQL fragment used by every listing query.
- `/recipes` loads all recipe summaries via page query (~78 KB gzipped) and filters client-side. Filter state lives in the URL (`filtersFromSearch`/`filtersToSearch`); it starts empty and reads `location.search` in an effect to avoid hydration mismatches.
- `src/lib/storage.js` uses `useSyncExternalStore` with an empty server snapshot; keep any new client-only state on that pattern rather than reading `localStorage` during render.
- Images are TheMealDB URLs; `RecipeImage` builds a `srcset` from the API's `/medium` (350), `/large` (500) and original (700) variants. `gatsby-plugin-image` is installed but unused for remote images.
- Don't SSR-hide content with Motion's `initial={{ opacity: 0 }}`: it renders invisible until hydration. `gatsby-browser.js` wraps the app in `MotionConfig reducedMotion="user"`.

## Motion system (the point of the project)

- **Scroll reveals are CSS, not Motion.** Put `ref={reveal}` (from `src/lib/reveal.js`) and `data-reveal="up|split|card|clip|spin|plate"` on an element, with optional `style={{ "--i": n }}` for stagger. One shared IntersectionObserver adds `data-inview`; `global.css` transitions between the states. Hidden states only apply under `html.js` (set by an inline script in `gatsby-ssr.js`, removed if the app hasn't hydrated within 5s) and `prefers-reduced-motion: no-preference`, and print CSS forces everything visible.
- Don't put a reveal transform and another transform (Motion `style`, hover scale, keyframes) on the same element; nest them.
- **Page transitions** live in `src/components/motion/PageTransition.js` (`wrapPageElement` in both gatsby-browser and gatsby-ssr). A curtain grows from the click point, then lifts. `shouldUpdateScroll` returns false across pages and queues the scroll for while the screen is covered. Reveals are paused (`setRevealReady(false)` in `onPreRouteUpdate`) until the curtain lifts. The page wrapper must not get a `transform`, or `position: fixed` children (curtain, timer tray, cursor preview) break; for the same reason `Drawer` portals to `<body>`.
- Use `useReducedMotion` / `useMedia` / `useFancyPointer` from `src/lib/media.js`, never Motion's `useReducedMotion`: Motion's reads `matchMedia` on the first client render and causes hydration error #418. Pointer effects (`Tilt`, `Magnetic`, cuisine cursor preview) run only for a fine pointer without reduced motion.
- Shared timings and springs are in `src/lib/motion.js`; the CSS easing is `--ease-out-expo`.
- `useScroll({ target })` binds its target once on mount. If the target element only renders conditionally (e.g. after a media query flips post-hydration), Motion silently tracks the whole page instead. Put the hook in a child component that mounts with the element, as `PinnedRow` in `HorizontalScroll.js` does.
- Scroll-driven containers that clip moving content use `overflow: clip`, not `hidden`: a hidden box is still a scroll container that keyboard focus can scroll sideways.
- Anything that applies a `transform` (Tilt, Motion `style`, reveal states) creates a stacking context and traps its children's `z-index`. Clickable overlays such as `SaveButton` must sit outside the transformed wrapper, or the card's full-card title link (`after:inset-0`) steals their clicks.
- Cooking timers live in `TimerProvider` (`src/components/recipe/useTimers.js`), mounted in `wrapRootElement` so they survive page changes; the tray renders there, layered above the page curtain (header 40, curtain 45, tray 46, drawer 50). Timers persist to `sessionStorage` (`sizzle:timers`), restored after mount and validated by `parseStoredTimers` in `src/lib/timers.js`. Each stores its step text and section; the tray links to `/recipes/<slug>/#step-N`, and `Method` scrolls to, focuses and highlights (`data-highlight`) that step once `whenRevealReady` says any page transition has finished.
- `<select class="select">` uses `appearance: base-select` (in an `@supports` block in `global.css`) to style the option list; other browsers fall back to the native list.
- Gatsby inlines CSS into each page's HTML and may skip re-rendering HTML when only CSS changed, leaving stale styles in `public/`. After CSS-only edits, run `npm run clean` before `npm run build`.
- The home hero dish is `siteMetadata.featuredRecipe` (a recipe slug), passed to the page query as context in `onCreatePage`; it falls back to the latest update when empty or unknown.
- `data-noprint` hides elements in print; the recipe page is designed to print as ingredients followed by method.
- `/pantry` ("Cook with what you have") recommends recipes from typed ingredients using `src/lib/pantry.js`. Matching is deterministic: names are normalized to word sets, a whole ingredient covers its forms and parts (tomato → chopped tomatoes, chicken → chicken breast) but never processed products or different foods sharing a word (tomato puree, coconut milk). Diet filters are inferred from ingredient names, conservatively. Tests in `src/lib/pantry.test.mjs` include cases found by running the matcher over all 790 recipes; rerun that kind of check after changing the word lists. Photo recognition and OCR were deferred.
- `/admin` is a read-only content overview with its own chrome (no `Layout`).
- Newsletter form and footer social icons are config-driven via `siteMetadata.newsletterAction` / `siteMetadata.social` in `gatsby-config.js`; the newsletter section is hidden while `newsletterAction` is empty. `react-social-icons/component` needs each network registered by import (see `footer.js`).

## Design system

Tokens live in `tailwind.config.js` (paper/surface/ink/muted/line, `herb` for actions, `saffron` for highlights; use `saffron-deep` wherever saffron must meet contrast) and component classes (`.page`, `.btn-primary`, `.btn-quiet`, `.btn-icon`, `.input`, `.select`, `.chip`, `.link`, `.plate`) in `src/styles/global.css`. Display type is Young Serif via `text-display-*`; body is Figtree. Tailwind runs through Gatsby's built-in PostCSS loader using `postcss.config.js`; `content` scans `src/pages`, `src/components` and `src/templates`.
