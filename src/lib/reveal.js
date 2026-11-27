// Scroll reveals. Elements carry data-reveal="<style>" and get data-inview once they enter the
// viewport; global.css animates between the two. One shared observer serves the whole page.
//
// Reveals are held while a page transition covers the screen, so they play after the curtain lifts.

let observer = null
let ready = true
const queue = new Set()
const callbacks = new Set()

const getObserver = () => {
  if (!observer) {
    observer = new IntersectionObserver(
      entries =>
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.setAttribute("data-inview", "")
          observer.unobserve(entry.target)
        }),
      { rootMargin: "0px 0px -8% 0px" }
    )
  }
  return observer
}

const observe = el => {
  if (typeof IntersectionObserver === "undefined")
    el.setAttribute("data-inview", "")
  else getObserver().observe(el)
}

// Use as a callback ref: <div ref={reveal} data-reveal="up" />
export const reveal = el => {
  if (!el || el.hasAttribute("data-inview")) return
  if (ready) observe(el)
  else queue.add(el)
}

// Run fn once the screen is uncovered (now, if no page transition is in progress).
// Returns a cancel function for effect cleanup.
export const whenRevealReady = fn => {
  if (ready) {
    fn()
    return () => {}
  }
  callbacks.add(fn)
  return () => callbacks.delete(fn)
}

export const setRevealReady = value => {
  ready = value
  if (!value) return
  queue.forEach(el => el.isConnected && observe(el))
  queue.clear()
  callbacks.forEach(fn => fn())
  callbacks.clear()
}
