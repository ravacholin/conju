import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useTouchHover, { touchHoverItemProps } from './useTouchHover.js'

const ROW_HEIGHT = 50
const ROWS = 10
const CONTENT_HEIGHT = ROWS * ROW_HEIGHT

let scroller
let list
let viewport
let originalElementFromPoint

/**
 * Mirrors the mobile layout: the list of rows lives inside a panel that
 * scrolls, which is what made the gesture ambiguous in the first place.
 * jsdom has no layout, so scrolling and hit testing are both faked — rows are
 * stacked from the top of the content, and a point maps to one by its y.
 */
function buildLayout() {
  scroller = document.createElement('div')
  scroller.style.overflowY = 'auto'
  Object.defineProperty(scroller, 'scrollHeight', { value: CONTENT_HEIGHT, configurable: true })
  Object.defineProperty(scroller, 'clientHeight', { value: 200, configurable: true })
  let scrollTop = 0
  Object.defineProperty(scroller, 'scrollTop', {
    configurable: true,
    get: () => scrollTop,
    set: (value) => { scrollTop = Math.max(0, Math.min(CONTENT_HEIGHT - 200, value)) }
  })
  scroller.getBoundingClientRect = () => ({ top: viewport.top, bottom: viewport.bottom })

  list = document.createElement('div')
  for (let i = 0; i < ROWS; i++) {
    const row = document.createElement('div')
    const [attr, value] = Object.entries(touchHoverItemProps(i))[0]
    row.setAttribute(attr, String(value))
    row.appendChild(document.createElement('span'))
    list.appendChild(row)
  }
  scroller.appendChild(list)
  document.body.appendChild(scroller)
}

function stubElementFromPoint() {
  document.elementFromPoint = (_x, y) => {
    const index = Math.floor((y + scroller.scrollTop) / ROW_HEIGHT)
    if (index < 0 || index >= ROWS) return scroller
    // The deepest element at the point is the content inside the row.
    return list.children[index].firstChild
  }
}

function touch(type, y, x = 10) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  event.touches = type === 'touchend' || type === 'touchcancel'
    ? []
    : [{ clientX: x, clientY: y }]
  list.dispatchEvent(event)
  return event
}

function mount(onHover) {
  const hook = renderHook(() => useTouchHover(onHover))
  act(() => hook.result.current.containerRef(list))
  return hook
}

beforeEach(() => {
  // Far enough off screen that the edge bands sit outside the points these
  // tests use; the auto-scroll test narrows it deliberately.
  viewport = { top: -1000, bottom: 1000 }
  buildLayout()
  originalElementFromPoint = document.elementFromPoint
  stubElementFromPoint()
})

afterEach(() => {
  document.elementFromPoint = originalElementFromPoint
  scroller.remove()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useTouchHover', () => {
  it('focuses the row under the finger on contact', () => {
    const onHover = vi.fn()
    mount(onHover)

    touch('touchstart', 25)

    expect(onHover).toHaveBeenCalledWith(0)
  })

  it('follows the finger across rows as it moves', () => {
    const onHover = vi.fn()
    mount(onHover)

    touch('touchstart', 25)
    touch('touchmove', 75)
    touch('touchmove', 125)
    touch('touchmove', 175)

    expect(onHover.mock.calls.map(([index]) => index)).toEqual([0, 1, 2, 3])
  })

  it('follows a swipe that starts moving right away', () => {
    // The list sits in a scrolling panel, which used to mean the gesture was
    // only taken once the finger had rested — so a swipe, which starts moving
    // at once, never got past the row it landed on.
    const onHover = vi.fn()
    mount(onHover)

    touch('touchstart', 25)
    touch('touchmove', 160)

    expect(onHover).toHaveBeenLastCalledWith(3)
  })

  it('reports a row only when it changes', () => {
    const onHover = vi.fn()
    mount(onHover)

    touch('touchstart', 10)
    touch('touchmove', 20)
    touch('touchmove', 40)

    expect(onHover).toHaveBeenCalledTimes(1)
  })

  it('keeps the panel still while the finger scrubs', () => {
    mount(vi.fn())

    touch('touchstart', 25)
    const move = touch('touchmove', 125)

    expect(move.defaultPrevented).toBe(true)
  })

  it('leaves a touch that misses the rows to the browser', () => {
    const onHover = vi.fn()
    mount(onHover)

    touch('touchstart', CONTENT_HEIGHT + 20)
    const move = touch('touchmove', 25)

    expect(onHover).not.toHaveBeenCalled()
    expect(move.defaultPrevented).toBe(false)
  })

  it('pulls the list along while the finger rests against the bottom edge', () => {
    vi.useFakeTimers()
    viewport = { top: 0, bottom: 200 }
    const onHover = vi.fn()
    mount(onHover)

    touch('touchstart', 25)
    touch('touchmove', 190) // inside the bottom band
    const beforeScroll = onHover.mock.calls.at(-1)[0]

    vi.advanceTimersByTime(200)

    expect(scroller.scrollTop).toBeGreaterThan(0)
    expect(onHover.mock.calls.at(-1)[0]).toBeGreaterThan(beforeScroll)
  })

  it('stops pulling the list once the finger lifts', () => {
    vi.useFakeTimers()
    viewport = { top: 0, bottom: 200 }
    mount(vi.fn())

    touch('touchstart', 25)
    touch('touchmove', 190)
    touch('touchend', 190)
    const resting = scroller.scrollTop

    vi.advanceTimersByTime(200)

    expect(scroller.scrollTop).toBe(resting)
  })

  it('ignores the release that ends a scrub, but not a tap', () => {
    const { result } = mount(vi.fn())

    touch('touchstart', 25)
    touch('touchmove', 125)
    touch('touchend', 125)
    expect(result.current.shouldIgnoreSelect()).toBe(true)

    touch('touchstart', 25)
    touch('touchmove', 27)
    touch('touchend', 27)
    expect(result.current.shouldIgnoreSelect()).toBe(false)
  })

  it('drops the gesture when a second finger lands', () => {
    const onHover = vi.fn()
    mount(onHover)

    touch('touchstart', 25)
    onHover.mockClear()

    const second = new Event('touchstart', { bubbles: true, cancelable: true })
    second.touches = [{ clientX: 10, clientY: 25 }, { clientX: 40, clientY: 25 }]
    list.dispatchEvent(second)
    touch('touchmove', 125)

    expect(onHover).not.toHaveBeenCalled()
  })

  it('stops listening once the list unmounts', () => {
    const onHover = vi.fn()
    const hook = mount(onHover)

    act(() => hook.result.current.containerRef(null))
    touch('touchstart', 25)

    expect(onHover).not.toHaveBeenCalled()
  })
})
