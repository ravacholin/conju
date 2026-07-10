import autoprefixer from 'autoprefixer'

// Adds vendor prefixes automatically based on the `browserslist` field in package.json,
// so older browsers get the `-webkit-`/`-moz-` variants of properties like
// backdrop-filter, clip-path, position: sticky, user-select, etc. Modern browsers are
// unaffected. Autoprefixer only adds prefixes; it does not change or remove any rules.
export default {
  plugins: [autoprefixer()]
}
