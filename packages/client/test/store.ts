import {
    configureStore,
    type Middleware,
    type UnknownAction,
} from '@reduxjs/toolkit';
import {
    putoutEditor,
    revive,
    type RootState,
} from '../src/store/reducers.ts';

/**
 * State overrides merged over the reducer's initial state.
 *
 * `workbench` is intentionally loose: middleware specs preload a partial
 * `parseResult`, a partial `transform`, and spec-only keys, none of which
 * satisfy the full `WorkbenchState`. Top-level keys stay fully typed.
 */
export type StoreOverrides = Omit<Partial<RootState>, 'workbench'> & {
    workbench?: Record<string, unknown>;
};

export type MakeStoreOptions = {
    
    /**
     * Listener middlewares to run first, e.g. `parserListener.middleware`.
     */
    middleware?: Middleware[];
    
    /**
     * Pass `false` when the spec preloads frozen or shared references that
     * would only trip the default immutability scan.
     */
    immutableCheck?: boolean;
    
    /**
     * Becomes the third argument of every thunk dispatched on the store.
     */
    extraArgument?: object;
};

const recordActions = (actions: UnknownAction[]): Middleware => () => (next) => (action) => {
    actions.push(action as UnknownAction);
    
    return next(action);
};

/**
 * The store `makeStore` hands back — handy for typing spec helpers such as
 * `renderMenu(store: TestStore)`.
 */
export type TestStore = ReturnType<typeof makeStore>['store'];

/**
 * Builds a `putoutEditor` store for a spec.
 *
 * `actions` collects every dispatched action in order, so a spec can assert
 * on what was dispatched without wiring its own recording middleware.
 */
export function makeStore(overrides: StoreOverrides = {}, options: MakeStoreOptions = {}) {
    const {
        middleware = [],
        immutableCheck = true,
        extraArgument,
    } = options;
    
    const actions: UnknownAction[] = [];
    
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    const state = {
        ...base,
        ...overrides,
        workbench: {
            ...base.workbench,
            ...overrides.workbench,
        },
    } as RootState;
    
    const store = configureStore({
        reducer: putoutEditor,
        preloadedState: revive(state),
        middleware: (getDefault) => getDefault({
            immutableCheck,
            serializableCheck: false,
            thunk: {
                extraArgument,
            },
        }).prepend(recordActions(actions), ...middleware),
    });
    
    return {
        store,
        actions,
    };
}
