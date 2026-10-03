import {configureStore} from '@reduxjs/toolkit';
import {rootReducer} from './root.ts';

/**
 * The one place a store is built. `index.tsx` and `test/store.ts` both go
 * through here, so a spec exercises the same wiring the page runs rather than a
 * store assembled separately.
 */
export const createAppStore = () => configureStore({
    reducer: rootReducer,
});
