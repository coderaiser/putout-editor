import {configureStore, type Store} from '@reduxjs/toolkit';
import {rootReducer} from '../src/store/root.ts';
import {initialState} from '../src/store/slice.ts';
import type {ChatAppState} from '../src/store/types.ts';

/**
 * The one store factory, for the same reason `index.tsx` goes through
 * `createAppStore`: a spec that built its own would be testing a store the page
 * never runs. Every chat spec gets its store here.
 *
 * `overrides` is a partial `chat` state merged over `initialState`, which is what
 * a component spec needs — `Input`'s recall specs preload `history` and nothing
 * else. Every key is optional, so a spec cannot preload a field that does not
 * exist and find out at runtime instead of at `tsc`.
 *
 * The spread is of `initialState` rather than a call to the reducer: RTK types a
 * reducer's return as `Partial` when it is written in object form, so going
 * through it here would make every field of `preloadedState` optional and `tsc`
 * could not tell a typo from a real field.
 */
export const makeStore = (overrides: Partial<ChatAppState> = {}): Store => configureStore({
    reducer: rootReducer,
    preloadedState: {
        chat: {
            ...initialState,
            ...overrides,
        },
    },
});
