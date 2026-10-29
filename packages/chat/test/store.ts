import {configureStore, type Store} from '@reduxjs/toolkit';
import {rootReducer} from '../src/store/root.ts';
import {initialState} from '../src/store/slice.ts';
import type {ChatAppState} from '../src/store/types.ts';

/**
 * The store factory for each chat spec. `overrides` merges over
 * `initialState`. Spread `initialState`, do not call the reducer: RTK types
 * its return as `Partial`, so `tsc` cannot find a wrong field.
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
