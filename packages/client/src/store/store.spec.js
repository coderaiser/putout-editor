import {test} from 'supertape';
import {createStore} from 'redux';
import {
    astexplorer,
    revive,
    persist,
} from './reducers.js';
import {
    setCode,
    setCursor,
    hideTransformer,
    openSettingsDialog,
    closeSettingsDialog,
    openShareDialog,
    closeShareDialog,
    setError,
    clearError,
    setSnippet,
    clearSnippet,
    reset,
    toggleFormatting,
    setKeyMap,
    startLoadingSnippet,
    doneLoadingSnippet,
    startSave,
    endSave,
} from './actions.js';

// --- helpers ---
// makeStore() is the ONLY function that changes between Redux, RTK, and Zustand.
// RTK:     configureStore({reducer: astexplorer, preloadedState: revive(preload)})
// Zustand: useStore.setState(revive(preload)); return useStore;
function makeStore(preload = {}) {
    const base = astexplorer(undefined, {
        type: '@@INIT',
    });
    
    return createStore(astexplorer, revive({
        ...base,
        ...preload,
    }));
}

const getState = (store) => store.getState();

function dispatch(store, action) {
    store.dispatch(action);
}

const makeRevision = (overrides = {}) => ({
    canSave: () => true,
    getCode: () => 'const x = 1',
    getParserID: () => 'babel',
    getParserSettings: () => null,
    getTransformerID: () => null,
    getTransformCode: () => '',
    getSnippetID: () => 'test-id',
    getRevisionID: () => 'r1',
    ...overrides,
});

// --- showSettingsDialog ---
test('store: showSettingsDialog defaults to false', (t) => {
    t.notOk(getState(makeStore()).showSettingsDialog);
    t.end();
});

test('store: openSettingsDialog sets showSettingsDialog to true', (t) => {
    const store = makeStore();
    dispatch(store, openSettingsDialog());
    
    t.ok(getState(store).showSettingsDialog);
    t.end();
});

test('store: closeSettingsDialog sets showSettingsDialog to false', (t) => {
    const store = makeStore();
    dispatch(store, openSettingsDialog());
    dispatch(store, closeSettingsDialog());
    
    t.notOk(getState(store).showSettingsDialog);
    t.end();
});

// --- showShareDialog ---
test('store: showShareDialog defaults to false', (t) => {
    t.notOk(getState(makeStore()).showShareDialog);
    t.end();
});

test('store: openShareDialog sets showShareDialog to true', (t) => {
    const store = makeStore();
    dispatch(store, openShareDialog());
    
    t.ok(getState(store).showShareDialog);
    t.end();
});

test('store: closeShareDialog sets showShareDialog to false', (t) => {
    const store = makeStore();
    dispatch(store, openShareDialog());
    dispatch(store, closeShareDialog());
    
    t.notOk(getState(store).showShareDialog);
    t.end();
});

// --- error ---
test('store: error defaults to null', (t) => {
    t.notOk(getState(makeStore()).error);
    t.end();
});

test('store: setError stores error', (t) => {
    const store = makeStore();
    const err = Error('fail');
    
    dispatch(store, setError(err));
    
    t.equal(getState(store).error, err);
    t.end();
});

test('store: clearError resets error to null', (t) => {
    const store = makeStore();
    dispatch(store, setError(Error('fail')));
    dispatch(store, clearError());
    
    t.notOk(getState(store).error);
    t.end();
});

// --- enableFormatting ---
test('store: enableFormatting defaults to false', (t) => {
    t.notOk(getState(makeStore()).enableFormatting);
    t.end();
});

test('store: toggleFormatting sets enableFormatting to true', (t) => {
    const store = makeStore();
    dispatch(store, toggleFormatting());
    
    t.ok(getState(store).enableFormatting);
    t.end();
});

test('store: toggleFormatting twice restores enableFormatting to false', (t) => {
    const store = makeStore();
    dispatch(store, toggleFormatting());
    dispatch(store, toggleFormatting());
    
    t.notOk(getState(store).enableFormatting);
    t.end();
});

// --- workbench.code ---
test('store: setCode updates workbench.code', (t) => {
    const store = makeStore();
    dispatch(store, setCode({
        code: 'const x = 1',
        cursor: 0,
    }));
    
    t.equal(getState(store).workbench.code, 'const x = 1');
    t.end();
});

// --- cursor ---
test('store: cursor defaults to null', (t) => {
    t.notOk(getState(makeStore()).cursor);
    t.end();
});

test('store: setCode with non-zero cursor updates cursor', (t) => {
    const store = makeStore();
    dispatch(store, setCode({
        code: 'x',
        cursor: 5,
    }));
    
    t.equal(getState(store).cursor, 5);
    t.end();
});

test('store: setCursor updates cursor', (t) => {
    const store = makeStore();
    dispatch(store, setCursor(12));
    
    t.equal(getState(store).cursor, 12);
    t.end();
});

// --- keyMap ---
test('store: setKeyMap updates workbench.keyMap', (t) => {
    const store = makeStore();
    dispatch(store, setKeyMap('emacs'));
    
    t.equal(getState(store).workbench.keyMap, 'emacs');
    t.end();
});

// --- showTransformPanel ---
test('store: showTransformPanel defaults to true', (t) => {
    t.ok(getState(makeStore()).showTransformPanel);
    t.end();
});

test('store: hideTransformer sets showTransformPanel to false', (t) => {
    const store = makeStore();
    dispatch(store, hideTransformer());
    
    t.notOk(getState(store).showTransformPanel);
    t.end();
});

// --- loadingSnippet ---
test('store: loadingSnippet defaults to false', (t) => {
    t.notOk(getState(makeStore()).loadingSnippet);
    t.end();
});

test('store: startLoadingSnippet sets loadingSnippet to true', (t) => {
    const store = makeStore();
    dispatch(store, startLoadingSnippet());
    
    t.ok(getState(store).loadingSnippet);
    t.end();
});

test('store: doneLoadingSnippet sets loadingSnippet to false', (t) => {
    const store = makeStore();
    dispatch(store, startLoadingSnippet());
    dispatch(store, doneLoadingSnippet());
    
    t.notOk(getState(store).loadingSnippet);
    t.end();
});

// --- saving / forking ---
test('store: saving defaults to false', (t) => {
    t.notOk(getState(makeStore()).saving);
    t.end();
});

test('store: startSave with fork=false sets saving to true', (t) => {
    const store = makeStore();
    dispatch(store, startSave(false));
    
    t.ok(getState(store).saving);
    t.end();
});

test('store: startSave with fork=true sets forking to true', (t) => {
    const store = makeStore();
    dispatch(store, startSave(true));
    
    t.ok(getState(store).forking);
    t.end();
});

test('store: startSave with fork=true does not set saving', (t) => {
    const store = makeStore();
    dispatch(store, startSave(true));
    
    t.notOk(getState(store).saving);
    t.end();
});

test('store: endSave resets saving to false', (t) => {
    const store = makeStore();
    dispatch(store, startSave(false));
    dispatch(store, endSave());
    
    t.notOk(getState(store).saving);
    t.end();
});

test('store: endSave resets forking to false', (t) => {
    const store = makeStore();
    dispatch(store, startSave(true));
    dispatch(store, endSave());
    
    t.notOk(getState(store).forking);
    t.end();
});

// --- activeRevision ---
test('store: activeRevision defaults to null', (t) => {
    t.notOk(getState(makeStore()).activeRevision);
    t.end();
});

test('store: setSnippet sets activeRevision', (t) => {
    const store = makeStore();
    const revision = makeRevision();
    
    dispatch(store, setSnippet(revision));
    
    t.equal(getState(store).activeRevision, revision);
    t.end();
});

test('store: setSnippet updates workbench.code from revision', (t) => {
    const store = makeStore();
    const revision = makeRevision({
        getCode: () => 'const y = 2',
    });
    
    dispatch(store, setSnippet(revision));
    
    t.equal(getState(store).workbench.code, 'const y = 2');
    t.end();
});

test('store: setSnippet resets cursor to null', (t) => {
    const store = makeStore();
    dispatch(store, setCursor(5));
    dispatch(store, setSnippet(makeRevision()));
    
    t.notOk(getState(store).cursor);
    t.end();
});

test('store: clearSnippet sets activeRevision to null', (t) => {
    const store = makeStore();
    dispatch(store, setSnippet(makeRevision()));
    dispatch(store, clearSnippet());
    
    t.notOk(getState(store).activeRevision);
    t.end();
});

test('store: clearSnippet resets cursor to null', (t) => {
    const store = makeStore();
    dispatch(store, setSnippet(makeRevision()));
    dispatch(store, clearSnippet());
    
    t.notOk(getState(store).cursor);
    t.end();
});

test('store: reset sets activeRevision to null', (t) => {
    const store = makeStore();
    dispatch(store, setSnippet(makeRevision()));
    dispatch(store, reset());
    
    t.notOk(getState(store).activeRevision);
    t.end();
});

test('store: reset resets cursor to null', (t) => {
    const store = makeStore();
    dispatch(store, setCursor(5));
    dispatch(store, reset());
    
    t.notOk(getState(store).cursor);
    t.end();
});

// --- persist / revive ---
test('store: persist does not include cursor', (t) => {
    const state = getState(makeStore());
    const persisted = persist({
        ...state,
        cursor: 42,
    });
    
    t.notOk('cursor' in persisted);
    t.end();
});

test('store: persist includes workbench.code', (t) => {
    const state = getState(makeStore());
    const persisted = persist(state);
    
    t.ok('code' in persisted.workbench);
    t.end();
});

test('store: revive sets workbench.initialCode from stored code', (t) => {
    const stored = revive({
        workbench: {
            code: 'const z = 3',
            keyMap: 'vim',
            transform: {
                code: '',
                transformer: 'putout',
            },
            parser: 'babel',
        },
        showTransformPanel: true,
        parserSettings: {},
        parserPerCategory: {},
    });
    
    t.equal(stored.workbench.initialCode, 'const z = 3');
    t.end();
});

test('store: revive sets workbench.transform.initialCode from stored transform code', (t) => {
    const stored = revive({
        workbench: {
            code: 'x',
            keyMap: 'vim',
            transform: {
                code: 'y',
                transformer: 'putout',
            },
            parser: 'babel',
        },
        showTransformPanel: true,
        parserSettings: {},
        parserPerCategory: {},
    });
    
    t.equal(stored.workbench.transform.initialCode, 'y');
    t.end();
});
