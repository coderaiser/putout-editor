/**
 * The store's types, re-exported from a module of their own.
 *
 * They are not in `index.ts` because `esm/merge-export-declarations` folds an
 * `export type {…}` into the neighbouring value list, and a `TypeScript`
 * interface has no runtime export — `tsc` then reports `does not provide an
 * export named 'ChatAppState'` at load. One file per kind of export is the shape
 * both gates accept, so this is a separate module rather than a comment saying
 * the lint is wrong.
 */
export type {ChatAppState} from './slice.ts';
export type {RootState} from './root.ts';
export type {Message} from './state.ts';

/**
 * The thunk-aware dispatch type.
 *
 * A bare `useDispatch()` is typed `Dispatch<UnknownAction>` and refuses to
 * accept `learnOpen(node)` — which is a thunk, not an action. The type has to
 * come from `createStore`'s return, and it is re-exported here for the same
 * reason every other type is: `esm/merge-export-declarations` folds a value
 * export into the neighbouring list and `tsc` then reports a missing export at
 * load. So it lives in this file with `RootState`.
 */
export type {AppDispatch} from './createStore.ts';
export type {
    CommandResult,
    FlatNode,
    Place,
} from '@putout/editor-commands';
