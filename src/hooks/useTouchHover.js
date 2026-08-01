import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Attribute a row carries so a touch point can be mapped back to its index.
 * Applied through `touchHoverItemProps` rather than by hand.
 */
const INDEX_ATTR = 'data-touch-hover-index'
const ITEM_SELECTOR = `[${INDEX_ATTR}]`

/** How long the finger must rest before a drag scrubs instead of scrolling. */
const HOLD_MS = 180
/** Finger jitter tolerated while waiting for the hold to elapse. */
const MOVE_TOLERANCE_PX = 10

/** Props every hoverable row must spread so the hook can identify it. */
export function touchHoverItemProps(index) {
  return { [INDEX_ATTR]: index }
}

function indexAtPoint(x, y) {
  const row = document.elementFromPoint(x, y)?.closest?.(ITEM_SELECTOR)
  if (!row) return -1
  const index = Number(row.getAttribute(INDEX_ATTR))
  return Number.isInteger(index) ? index : -1
}

/**
 * A drag can only be mistaken for a scroll when something around the list can
 * actually scroll. When nothing can, scrubbing may start on contact.
 */
function hasScrollableAncestor(node) {
  for (let el = node; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = window.getComputedStyle(el)
    const scrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
    if (scrollable && el.scrollHeight > el.clientHeight + 1) return true
  }
  const root = document.scrollingElement
  return root ? root.scrollHeight > root.clientHeight + 1 : false
}

/**
 * Gives a list of rows the same hover behaviour on touch that it has with a
 * mouse: sliding a finger across the rows focuses whichever one is underneath,
 * so the highlight animation and the preview panel follow the finger.
 *
 * Touch devices fire no `mouseenter` while the finger travels, so the position
 * is resolved from the touch point on every move. Scrolling is preserved by
 * only taking over the gesture once the finger has rested for `HOLD_MS` — a
 * drag that starts moving right away is a scroll and is left to the browser.
 *
 * @param {(index: number) => void} onHover called with the row under the finger
 * @returns {{ containerRef: (el: HTMLElement|null) => void, shouldIgnoreSelect: () => boolean }}
 *   `containerRef` goes on the element wrapping the rows; `shouldIgnoreSelect`
 *   is consumed by the row's click handler so a scrub does not select.
 */
export default function useTouchHover(onHover) {
  const [container, setContainer] = useState(null)
  const containerRef = useCallback((el) => setContainer(el), [])

  const onHoverRef = useRef(onHover)
  useEffect(() => { onHoverRef.current = onHover })

  // Set while the finger travels across rows, so the release that ends the
  // scrub does not read as a tap on whichever row it happened to land on.
  const suppressSelectRef = useRef(false)

  useEffect(() => {
    if (!container) return undefined

    let gesture = null
    let holdTimer = null

    const clearHold = () => {
      if (holdTimer) {
        clearTimeout(holdTimer)
        holdTimer = null
      }
    }

    const hoverAt = (x, y) => {
      const index = indexAtPoint(x, y)
      if (index >= 0) onHoverRef.current?.(index)
    }

    const handleStart = (e) => {
      clearHold()
      if (e.touches.length !== 1) {
        gesture = null
        return
      }
      const touch = e.touches[0]
      suppressSelectRef.current = false
      gesture = { x: touch.clientX, y: touch.clientY, scrubbing: false, abandoned: false }

      // Contact alone already reads as the pointer arriving on the row.
      hoverAt(touch.clientX, touch.clientY)

      if (!hasScrollableAncestor(container)) {
        gesture.scrubbing = true
        return
      }
      holdTimer = setTimeout(() => {
        holdTimer = null
        if (gesture && !gesture.abandoned) gesture.scrubbing = true
      }, HOLD_MS)
    }

    const handleMove = (e) => {
      if (!gesture || e.touches.length !== 1) return
      const touch = e.touches[0]
      const travelled =
        Math.abs(touch.clientX - gesture.x) > MOVE_TOLERANCE_PX ||
        Math.abs(touch.clientY - gesture.y) > MOVE_TOLERANCE_PX

      if (!gesture.scrubbing) {
        // Moving before the hold elapsed means the user is scrolling.
        if (travelled) {
          gesture.abandoned = true
          clearHold()
        }
        return
      }

      // The list owns the gesture now, so the page must not scroll under it.
      if (e.cancelable) e.preventDefault()
      if (travelled) suppressSelectRef.current = true
      hoverAt(touch.clientX, touch.clientY)
    }

    const handleEnd = () => {
      clearHold()
      gesture = null
    }

    container.addEventListener('touchstart', handleStart, { passive: true })
    // Non-passive: scrubbing has to be able to cancel the scroll.
    container.addEventListener('touchmove', handleMove, { passive: false })
    container.addEventListener('touchend', handleEnd, { passive: true })
    container.addEventListener('touchcancel', handleEnd, { passive: true })

    return () => {
      clearHold()
      container.removeEventListener('touchstart', handleStart)
      container.removeEventListener('touchmove', handleMove)
      container.removeEventListener('touchend', handleEnd)
      container.removeEventListener('touchcancel', handleEnd)
    }
  }, [container])

  const shouldIgnoreSelect = useCallback(() => {
    if (!suppressSelectRef.current) return false
    suppressSelectRef.current = false
    return true
  }, [])

  return { containerRef, shouldIgnoreSelect }
}
