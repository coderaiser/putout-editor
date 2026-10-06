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
export type {
    CommandResult,
    FlatNode,
    Place,
} from '@putout/editor-commands';
