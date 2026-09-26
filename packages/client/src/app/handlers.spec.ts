import {test} from 'supertape';
import {installHandlers} from './handlers.ts';
import {
    initialState,
    type State,
    type WorkbenchState,
} from '../store/state.ts';
import {revive} from '../store/revive.ts';

const SNIPPET_LOAD = 'snippet/load';

const makeStore = (state: State) => {
    const dispatched: string[] = [];
    
    return {
        dispatched,
        store: {
            getState: () => state as State,
            dispatch: (action: {
                type: string;
            }) => {
                dispatched.push(action.type);
            },
        },
    };
};

const makeState = (workbench: Partial<WorkbenchState> = {}): State => ({
    ...initialState,
    workbench: {
        ...initialState.workbench,
        ...workbench,
    },
});

// `canSaveTransform` is `showTransformer && transform.code !== transform.initialCode`,
// so the clean state has to be a *revived* one - revive is what derives
// initialCode from code. initialState is already dirty by that measure, since it
// ships the transformer's default transform against the parser's code example,
// so using it here would make the no-warning case untestable.
const clean = revive(initialState);

const dirty = makeState({
    transform: {
        ...clean.workbench.transform,
        code: 'const b = 2;',
    },
});

test('installHandlers: loads the snippet on boot when the hash is set', (t) => {
    const {dispatched, store} = makeStore(clean);
    const before = location.hash;
    
    location.hash = '#/gist/1/2';
    installHandlers(store);
    location.hash = before;
    
    const result = dispatched;
    const expected = [SNIPPET_LOAD];
    
    t.deepEqual(result, expected);
    t.end();
});

test('installHandlers: does not load a snippet without a hash', (t) => {
    const {dispatched, store} = makeStore(clean);
    const before = location.hash;
    
    location.hash = '';
    installHandlers(store);
    location.hash = before;
    
    const result = dispatched;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('installHandlers: reloads the snippet when the hash changes', (t) => {
    const {dispatched, store} = makeStore(clean);
    const before = location.hash;
    
    location.hash = '';
    const {onHashChange} = installHandlers(store);
    
    onHashChange();
    location.hash = before;
    
    const result = dispatched;
    const expected = [SNIPPET_LOAD];
    
    t.deepEqual(result, expected);
    t.end();
});

test('installHandlers: installs onhashchange on the global', (t) => {
    const {store} = makeStore(clean);
    const before = location.hash;
    
    location.hash = '';
    installHandlers(store);
    
    location.hash = before;
    
    const result = typeof globalThis.onhashchange;
    const expected = 'function';
    
    t.equal(result, expected);
    t.end();
});

test('installHandlers: warns on unload when the transform changed', (t) => {
    const {store} = makeStore(dirty);
    
    const {onBeforeUnload} = installHandlers(store);
    const result = onBeforeUnload();
    const expected = 'You have unsaved transform code. Do you really want to leave?';
    
    t.equal(result, expected);
    t.end();
});

test('installHandlers: does not warn on unload when nothing changed', (t) => {
    const {store} = makeStore(clean);
    
    const {onBeforeUnload} = installHandlers(store);
    const result = onBeforeUnload();
    
    t.notOk(result);
    t.end();
});
