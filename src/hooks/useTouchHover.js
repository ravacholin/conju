import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Attribute a row carries so a touch point can be mapped back to its index.
 * Applied through `touchHoverItemProps` rather than by hand.
 */
const INDEX_ATTR = 'data-touch-hover-index'
const ITEM_SELECTOR = `[${INDEX_ATTR}]`

/** Finger travel beyond this reads as a scrub, so the release must not select. */
const MOVE_TOLERANCE_PX = 10
/** Band at each end of the scroller where a scrub keeps pulling the list along. */
const EDGE_ZONE_PX = 56
/** Peak auto-scroll speed inside that band, in pixels per frame. */
const EDGE_SPEED_PX = 14

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
 * Nearest ancestor that actually scrolls. The scrub owns the finger, so this is
 * what has to be moved for rows past the fold to come within reach.
 */
function scrollParentOf(node) {
  for (let el = node?.parentElement; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = window.getComputedStyle(el)
    const scrollable = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay'
    if (scrollable && el.scrollHeight > el.clientHeight + 1) return el
  }
  const root = document.scrollingElement
  return root && root.scrollHeight > root.clientHeight + 1 ? root : null
}

/** Where the scroller sits on screen, which is what the finger is measured against. */
function scrollerBounds(scroller) {
  if (scroller === document.scrollingElement) {
    return { top: 0, bottom: window.innerHeight || 0 }
  }
  const rect = scroller.getBoundingClientRect()
  return { top: rect.top, bottom: rect.bottom }
}

/**
 * How far to scroll for a finger held at `y`: nothing in the middle of the
 * scroller, ramping up to `EDGE_SPEED_PX` as it reaches either end.
 */
function edgeDelta(scroller, y) {
  const { top, bottom } = scrollerBounds(scroller)
  if (bottom - top < EDGE_ZONE_PX * 2) return 0
  if (y < top + EDGE_ZONE_PX) {
    const depth = Math.min(1, (top + EDGE_ZONE_PX - y) / EDGE_ZONE_PX)
    return -EDGE_SPEED_PX * depth
  }
  if (y > bottom - EDGE_ZONE_PX) {
    const depth = Math.min(1, (y - (bottom - EDGE_ZONE_PX)) / EDGE_ZONE_PX)
    return EDGE_SPEED_PX * depth
  }
  return 0
}

/**
 * Gives a list of rows the same hover behaviour on touch that it has with a
 * mouse: sliding a finger across the rows focuses whichever one is underneath,
 * so the highlight animation and the preview panel follow the finger.
 *
 * Touch devices fire no `mouseenter` while the finger travels, so the position
 * is resolved from the touch point on every move. A touch that lands on a row
 * takes the gesture straight away — waiting for the finger to settle first only
 * loses the swipes that start moving at once, which is most of them. The list
 * therefore does not scroll under the finger (see the `touch-action` rule on
 * `.vo-options-list`); instead, holding the finger against either end of the
 * scroller pulls the list along so rows past the fold stay reachable. A touch
 * that starts anywhere else — the padding, the panel around the list — is left
 * to the browser and scrolls as usual.
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
    let frame = null

    const stopAutoScroll = () => {
      if (frame !== null) {
        cancelAnimationFrame(frame)
        frame = null
      }
    }

    // Rows the finger never left are skipped, so a scrub only re-renders the
    // step when the focused row actually changes.
    const hoverAt = (x, y) => {
      const index = indexAtPoint(x, y)
      if (index < 0 || index === gesture?.index) return
      if (gesture) gesture.index = index
      onHoverRef.current?.(index)
    }

    // While the finger rests against an end of the scroller the list keeps
    // coming, and each step brings a new row under the (stationary) finger.
    const autoScrollStep = () => {
      frame = null
      if (!gesture?.scroller) return
      const delta = edgeDelta(gesture.scroller, gesture.y)
      if (!delta) return
      const before = gesture.scroller.scrollTop
      gesture.scroller.scrollTop = before + delta
      if (gesture.scroller.scrollTop === before) return // reached the end
      hoverAt(gesture.x, gesture.y)
      frame = requestAnimationFrame(autoScrollStep)
    }

    const syncAutoScroll = () => {
      if (!gesture?.scroller) return
      if (frame === null && edgeDelta(gesture.scroller, gesture.y)) {
        frame = requestAnimationFrame(autoScrollStep)
      }
    }

    const handleStart = (e) => {
      stopAutoScroll()
      gesture = null
      if (e.touches.length !== 1) return

      const touch = e.touches[0]
      const index = indexAtPoint(touch.clientX, touch.clientY)
      // Off the rows the list has no business with the gesture: let it scroll.
      if (index < 0) return

      suppressSelectRef.current = false
      gesture = {
        startX: touch.clientX,
        startY: touch.clientY,
        x: touch.clientX,
        y: touch.clientY,
        index: -1,
        scroller: scrollParentOf(container)
      }

      // Contact alone already reads as the pointer arriving on the row.
      hoverAt(touch.clientX, touch.clientY)
    }

    const handleMove = (e) => {
      if (!gesture || e.touches.length !== 1) return
      const touch = e.touches[0]
      gesture.x = touch.clientX
      gesture.y = touch.clientY

      if (
        Math.abs(touch.clientX - gesture.startX) > MOVE_TOLERANCE_PX ||
        Math.abs(touch.clientY - gesture.startY) > MOVE_TOLERANCE_PX
      ) {
        suppressSelectRef.current = true
      }

      // The list owns the gesture, so the page must not scroll under it. CSS
      // `touch-action` already says as much; this covers the browsers that
      // only honour the event.
      if (e.cancelable) e.preventDefault()

      hoverAt(touch.clientX, touch.clientY)
      syncAutoScroll()
    }

    const handleEnd = () => {
      stopAutoScroll()
      gesture = null
    }

    container.addEventListener('touchstart', handleStart, { passive: true })
    // Non-passive: scrubbing has to be able to cancel the scroll.
    container.addEventListener('touchmove', handleMove, { passive: false })
    container.addEventListener('touchend', handleEnd, { passive: true })
    container.addEventListener('touchcancel', handleEnd, { passive: true })

    return () => {
      stopAutoScroll()
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
