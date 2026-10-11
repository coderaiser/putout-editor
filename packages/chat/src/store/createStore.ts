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

/**
 * The thunk-aware dispatch type.
 *
 * Derived from the store rather than written by hand: `configureStore` adds the
 * thunk middleware, and the middleware is what makes `dispatch(learnOpen(node))`
 * legal. `types.ts` re-exports this so components import it from `#store/types`
 * alongside `RootState`, which is where every other type in the store comes from.
 */
export type AppDispatch = ReturnType<typeof createAppStore>['dispatch'];
