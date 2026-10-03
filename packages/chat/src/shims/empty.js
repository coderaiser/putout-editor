/**
 * The module a node-only package resolves to instead of itself.
 *
 * It exports nothing, so a call site that does `const {x} = require('@putout/…')`
 * gets `undefined` rather than a module-resolution error — which is the point:
 * 🐊**Putout** requires these lazily, and the page only ever reaches them
 * through code paths a browser cannot run anyway.
 */
export default {};
