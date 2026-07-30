/**
 * True when a keyboard event came from somewhere the user is typing.
 *
 * The menu binds several single-key shortcuts to `window` (digits 1-9 to pick
 * an option, arrows to navigate, Escape/Backspace to go back). All of them
 * must stand down while a text field has focus, or typing "a2" into the search
 * box would fire the shortcut for option 2 and navigate away mid-keystroke.
 */
export function isTextEntryTarget(el) {
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
}
