import {
    configureStore,
    type Middleware,
    type UnknownAction,
} from '@reduxjs/toolkit';
import {
    putoutEditor,
    revive,
    type RootState,
    type TransformState,
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

/**
 * `revive()` recomputes these from other state, so an override naming them is
 * silently discarded — `workbench.parserSettings` in particular comes out as
 * `null` and the spec quietly stops exercising what it meant to. Refuse the
 * override instead of dropping it on the floor.
 */
const DERIVED_WORKBENCH = [
    'initialCode',
    'parserSettings',
];

const DERIVED_TRANSFORM = [
    'initialCode',
];

function assertNotDerived(workbench: Record<string, unknown> = {}) {
    for (const key of DERIVED_WORKBENCH)
        if (key in workbench)
            throw Error(`makeStore: workbench.${key} is derived by revive() and would be discarded — set the source field instead.`);
    
    const transform = (workbench.transform || {}) as Record<string, unknown>;
    
    for (const key of DERIVED_TRANSFORM)
        if (key in transform)
            throw Error(`makeStore: workbench.transform.${key} is derived by revive() and would be discarded — set workbench.transform.code instead.`);
}

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
    
    assertNotDerived(overrides.workbench);
    
    // `workbench.transform` merges too, so `{transform: {code}}` keeps the
    
    // default `transformer` rather than dropping it.
    const {transform, ...workbench} = overrides.workbench || {};
    const transformOverride = transform as Partial<TransformState> | undefined;
    
    const state = {
        ...base,
        ...overrides,
        workbench: {
            ...base.workbench,
            ...workbench,
            transform: {
                ...base.workbench.transform,
                ...transformOverride,
            },
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
