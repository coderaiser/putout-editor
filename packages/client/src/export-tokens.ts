// CSS custom properties consumed by Tree and its sub-components.
//
// A side-effect import, not `export {default as tokensUrl} from './css/tokens.css'`.
// The value form typechecks — `src/types/supertape.d.ts` declares `*.css` as
// `any` — and then fails in every consumer without a bundler:
//
//   error: Cannot find module './css/tokens.css'
//
// which is every runtime except rspack: node, bun, and the test runner without
// a CSS loader all refuse it. A `.css` file has no JavaScript default export,
// so there was never a value to hand out. This is the shape the other ten
// client files use.
import './css/tokens.css';

export const tokens = true;
