// Public re-export for packages that embed the AST tree.
// Only Tree.tsx is exported — the barrel editor-ast-tree/index.tsx is NOT,
// because it drags in #editor and #editor-ast-json.
export {default as Tree} from './editor-ast-tree/Tree.tsx';
export type {ParseResult} from './store/state.ts'; // the store shape, not types.ts
