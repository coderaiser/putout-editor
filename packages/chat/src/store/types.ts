/**
 * Types in their own module: `esm/merge-export-declarations` merges an
 * `export type` into a value list, and `tsc` then fails on load.
 */
export type {ChatAppState} from './slice.ts';
export type {RootState} from './root.ts';
export type {Message} from './state.ts';

/**
 * The thunk-aware dispatch type, from the return of `createStore`. A bare
 * `useDispatch()` does not accept `learnOpen(node)`.
 */
export type {AppDispatch} from './createStore.ts';
export type {
    CommandResult,
    FlatNode,
    Place,
} from '@putout/editor-commands';
