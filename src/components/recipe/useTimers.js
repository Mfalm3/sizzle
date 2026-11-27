import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import TimerTray from "./TimerTray"
import { parseStoredTimers } from "../../lib/timers"

const STORAGE_KEY = "sizzle:timers"

// Three short beeps through Web Audio. The context is created on the "start" click,
// because browsers only allow audio that starts from a user gesture.
const beep = ctx => {
  if (!ctx) return
  ;[0, 0.35, 0.7].forEach(offset => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset)
    gain.gain.exponentialRampToValueAtTime(
      0.25,
      ctx.currentTime + offset + 0.02
    )
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + offset + 0.25
    )
    osc.connect(gain).connect(ctx.destination)
    osc.start(ctx.currentTime + offset)
    osc.stop(ctx.currentTime + offset + 0.3)
  })
}

const TimerContext = createContext({ start: () => {} })

// Countdown timers keyed to wall-clock end times, so a backgrounded tab still finishes on time.
// Mounted once at the app root (wrapRootElement) so timers keep running while you browse other
// pages; the tray renders here too, above whichever page is showing.
// Saved to sessionStorage, so timers survive reloads within the tab (end times are wall-clock,
// so a restored timer is exact, and one that finished meanwhile shows as done).
export const TimerProvider = ({ children }) => {
  const [timers, setTimers] = useState([])
  const [now, setNow] = useState(() => Date.now())
  const [restored, setRestored] = useState(false)
  const audio = useRef(null)

  // Restore after mount, not during render, so the first client render matches the server HTML.
  useEffect(() => {
    let saved = []
    try {
      saved = parseStoredTimers(window.sessionStorage.getItem(STORAGE_KEY))
    } catch {
      // Storage blocked (privacy mode): timers just won't survive a reload.
    }
    setNow(Date.now())
    setTimers(saved)
    setRestored(true)
  }, [])

  // Write only after restoring, or the empty initial list would overwrite what was saved.
  useEffect(() => {
    if (!restored) return
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(timers))
    } catch {
      // Full or blocked storage: keep running in memory.
    }
  }, [timers, restored])
  const running = timers.some(t => !t.done)

  // One interval, and only while something is counting down.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    const finished = new Set(
      timers.filter(t => !t.done && t.endsAt <= now).map(t => t.id)
    )
    if (!finished.size) return
    beep(audio.current)
    navigator.vibrate?.([200, 100, 200])
    setTimers(list =>
      list.map(t => (finished.has(t.id) ? { ...t, done: true } : t))
    )
  }, [now, timers])

  // recipe: { name, slug }; stepText and section give the tray enough context to explain the
  // timer and link back to its step from any page.
  const start = useCallback(
    ({ label, seconds, step, recipe, stepText, section }) => {
      try {
        audio.current =
          audio.current ||
          new (window.AudioContext || window.webkitAudioContext)()
        audio.current.resume()
      } catch {
        // No Web Audio: the tray still shows the finished timer.
      }
      const at = Date.now()
      setNow(at)
      setTimers(list => [
        ...list,
        {
          id: `${at}-${recipe.slug}-${step}`,
          label,
          step,
          seconds,
          recipe,
          stepText,
          section: section || null,
          endsAt: at + seconds * 1000,
          done: false,
        },
      ])
    },
    []
  )

  const remove = useCallback(
    id => setTimers(list => list.filter(t => t.id !== id)),
    []
  )

  return (
    <TimerContext.Provider value={{ start }}>
      {children}
      <TimerTray timers={timers} now={now} onRemove={remove} />
    </TimerContext.Provider>
  )
}

export const useTimers = () => useContext(TimerContext)
