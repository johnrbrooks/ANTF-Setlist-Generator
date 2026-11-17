import { useEffect, useRef, useState } from 'react'

const SETTLE_DELAY_MS = 180

export default function useScrollActivity() {
  const [scrolling, setScrolling] = useState(false)
  const settleTimer = useRef(null)
  const frame = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      if (frame.current === null) {
        frame.current = window.requestAnimationFrame(() => {
          setScrolling(true)
          frame.current = null
        })
      }
      window.clearTimeout(settleTimer.current)
      settleTimer.current = window.setTimeout(() => setScrolling(false), SETTLE_DELAY_MS)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.clearTimeout(settleTimer.current)
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
    }
  }, [])

  return scrolling
}
