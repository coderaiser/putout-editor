import {test} from 'supertape';
import {
    putoutEditor,
    persist,
    revive,
    openSettingsDialog,
    closeSettingsDialog,
    openShareDialog,
    closeShareDialog,
    startLoadingSnippet,
    doneLoadingSnippet,
    startSave,
    endSave,
    setCursor,
    setCode,
    reset,
    setSnippet,
    clearSnippet,
    setError,
    clearError,
    selectTransformer,
    hideTransformer,
    setParserSettings,
    setParser,
    setTransformState,
    setKeyMap,
    dropText,
    setParseResult,
    selectCategory,
    setHighlight,
    clearHighlight,
} from './reducers.js';

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

function getInitState() {
    const state = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    return JSON.parse(JSON.stringify(state));
}

const getCategory = () => ({
    id: 'javascript',
    displayName: 'JavaScript',
    codeExample: 'x',
    fileExtension: 'js',
    parsers: [{
        showInMenu: true,
        id: 'babel',
    }],
    transformers: [],
});

const getEspreeParser = () => ({
    id: 'espree',
    category: {
        id: 'javascript',
    },
});

test('reducers: persist: strips cursor', (t) => {
    const state = {
        ...getInitState(),
        cursor: 5,
    };
    
    const result = persist(state);
    
    t.notOk(result.cursor);
    t.end();
});

test('reducers: persist: strips parseResult', (t) => {
    const state = {
        ...getInitState(),
        workbench: {
            ...getInitState().workbench,
            parseResult: {
                ast: {
                    type: 'Program',
                },
            },
        },
    };
    
    const result = persist(state);
    
    t.notOk(result.workbench.parseResult);
    t.end();
});

test('reducers: persist: keeps workbench parser', (t) => {
    const state = getInitState();
    const result = persist(state);
    
    t.equal(result.workbench.parser, state.workbench.parser);
    t.end();
});

test('reducers: revive: sets initialCode from code', (t) => {
    const state = getInitState();
    const result = revive(state);
    
    t.equal(result.workbench.initialCode, state.workbench.code);
    t.end();
});

test('reducers: revive: sets transform.initialCode', (t) => {
    const state = getInitState();
    const result = revive(state);
    
    t.equal(result.workbench.transform.initialCode, state.workbench.transform.code);
    t.end();
});

test('reducers: revive: applies parserSettings for current parser', (t) => {
    const state = {
        ...getInitState(),
        parserSettings: {
            babel: {
                plugins: ['jsx'],
            },
        },
    };
    
    const result = revive(state);
    
    t.deepEqual(result.workbench.parserSettings, {
        plugins: ['jsx'],
    });
    t.end();
});

test('reducers: revive: uses initialState when undefined', (t) => {
    const result = revive();
    
    t.ok(result);
    t.end();
});

test('reducers: open settings dialog', (t) => {
    const state = putoutEditor(getInitState(), openSettingsDialog());
    
    t.ok(state.showSettingsDialog);
    t.end();
});

test('reducers: close settings dialog', (t) => {
    const open = putoutEditor(getInitState(), openSettingsDialog());
    const state = putoutEditor(open, closeSettingsDialog());
    
    t.notOk(state.showSettingsDialog);
    t.end();
});

test('reducers: open share dialog', (t) => {
    const state = putoutEditor(getInitState(), openShareDialog());
    
    t.ok(state.showShareDialog);
    t.end();
});

test('reducers: close share dialog', (t) => {
    const open = putoutEditor(getInitState(), openShareDialog());
    const state = putoutEditor(open, closeShareDialog());
    
    t.notOk(state.showShareDialog);
    t.end();
});

test('reducers: start loading snippet', (t) => {
    const state = putoutEditor(getInitState(), startLoadingSnippet());
    
    t.ok(state.loadingSnippet);
    t.end();
});

test('reducers: done loading snippet', (t) => {
    const loading = putoutEditor(getInitState(), startLoadingSnippet());
    const state = putoutEditor(loading, doneLoadingSnippet());
    
    t.notOk(state.loadingSnippet);
    t.end();
});

test('reducers: start save not fork sets saving', (t) => {
    const state = putoutEditor(getInitState(), startSave(false));
    
    t.ok(state.saving);
    t.end();
});

test('reducers: start save not fork unsets forking', (t) => {
    const state = putoutEditor(getInitState(), startSave(false));
    
    t.notOk(state.forking);
    t.end();
});

test('reducers: start save with fork sets forking', (t) => {
    const state = putoutEditor(getInitState(), startSave(true));
    
    t.ok(state.forking);
    t.end();
});

test('reducers: start save with fork unsets saving', (t) => {
    const state = putoutEditor(getInitState(), startSave(true));
    
    t.notOk(state.saving);
    t.end();
});

test('reducers: end save unsets saving', (t) => {
    const saving = putoutEditor(getInitState(), startSave(false));
    const state = putoutEditor(saving, endSave(false));
    
    t.notOk(state.saving);
    t.end();
});

test('reducers: set cursor', (t) => {
    const state = putoutEditor(getInitState(), setCursor(10));
    
    t.equal(state.cursor, 10);
    t.end();
});

test('reducers: set code with cursor', (t) => {
    const state = putoutEditor(getInitState(), setCode({
        code: 'new',
        cursor: 5,
    }));
    
    t.equal(state.cursor, 5);
    t.end();
});

test('reducers: set code with null cursor keeps previous', (t) => {
    const withCursor = putoutEditor(getInitState(), setCursor(3));
    const state = putoutEditor(withCursor, setCode({
        code: 'new',
        cursor: 0,
    }));
    
    t.equal(state.cursor, 3);
    t.end();
});

test('reducers: reset sets cursor to null', (t) => {
    const withCursor = putoutEditor(getInitState(), setCursor(3));
    const state = putoutEditor(withCursor, reset());
    
    t.notOk(state.cursor);
    t.end();
});

test('reducers: set snippet sets cursor to null', (t) => {
    const withCursor = putoutEditor(getInitState(), setCursor(3));
    const state = putoutEditor(withCursor, setSnippet(makeRevision()));
    
    t.notOk(state.cursor);
    t.end();
});

test('reducers: clear snippet sets cursor to null', (t) => {
    const withCursor = putoutEditor(getInitState(), setCursor(3));
    const state = putoutEditor(withCursor, clearSnippet());
    
    t.notOk(state.cursor);
    t.end();
});

test('reducers: set error', (t) => {
    const state = putoutEditor(getInitState(), setError(Error('test error')));
    
    t.ok(state.error);
    t.end();
});

test('reducers: set error message', (t) => {
    const state = putoutEditor(getInitState(), setError(Error('test error')));
    
    t.equal(state.error.message, 'test error');
    t.end();
});

test('reducers: clear error', (t) => {
    const errState = putoutEditor(getInitState(), setError(Error('test error')));
    const state = putoutEditor(errState, clearError());
    
    t.notOk(state.error);
    t.end();
});


test('reducers: select transformer shows transform panel', (t) => {
    const transformer = {
        id: 'putout',
        defaultParserID: 'babel',
        defaultTransform: '',
    };
    
    const state = putoutEditor(getInitState(), selectTransformer(transformer));
    
    t.ok(state.showTransformPanel);
    t.end();
});

test('reducers: hide transformer returns false', (t) => {
    const state = putoutEditor(getInitState(), hideTransformer());
    
    t.notOk(state.showTransformPanel);
    t.end();
});

test('reducers: set snippet with transformer shows transform panel', (t) => {
    const rev = makeRevision({
        getTransformerID: () => 'putout',
    });
    
    const state = putoutEditor(getInitState(), setSnippet(rev));
    
    t.ok(state.showTransformPanel);
    t.end();
});

test('reducers: set snippet without transformer hides transform panel', (t) => {
    const rev = makeRevision({
        getTransformerID: () => null,
    });
    
    const state = putoutEditor(getInitState(), setSnippet(rev));
    
    t.notOk(state.showTransformPanel);
    t.end();
});

test('reducers: set snippet sets activeRevision', (t) => {
    const rev = makeRevision();
    const state = putoutEditor(getInitState(), setSnippet(rev));
    
    t.equal(state.activeRevision, rev);
    t.end();
});

test('reducers: clear snippet clears activeRevision', (t) => {
    const rev = makeRevision();
    const withRev = putoutEditor(getInitState(), setSnippet(rev));
    const state = putoutEditor(withRev, clearSnippet());
    
    t.notOk(state.activeRevision);
    t.end();
});

test('reducers: reset clears activeRevision', (t) => {
    const rev = makeRevision();
    const withRev = putoutEditor(getInitState(), setSnippet(rev));
    const state = putoutEditor(withRev, reset());
    
    t.notOk(state.activeRevision);
    t.end();
});

test('reducers: select category clears activeRevision', (t) => {
    const rev = makeRevision();
    const withRev = putoutEditor(getInitState(), setSnippet(rev));
    
    const state = putoutEditor(withRev, selectCategory(getCategory()));
    
    t.notOk(state.activeRevision);
    t.end();
});

test('reducers: set code', (t) => {
    const state = putoutEditor(getInitState(), setCode({
        code: 'new code',
    }));
    
    t.equal(state.workbench.code, 'new code');
    t.end();
});

test('reducers: set parse result', (t) => {
    const result = {
        ast: {
            type: 'Program',
        },
        error: null,
    };
    
    const state = putoutEditor(getInitState(), setParseResult(result));
    
    t.equal(state.workbench.parseResult, result);
    t.end();
});

test('reducers: set parser settings on workbench', (t) => {
    const state = putoutEditor(getInitState(), setParserSettings({
        plugins: ['jsx'],
    }));
    
    t.deepEqual(state.workbench.parserSettings, {
        plugins: ['jsx'],
    });
    t.end();
});

test('reducers: set parser stores per category', (t) => {
    const state = putoutEditor(getInitState(), setParser(getEspreeParser()));
    
    t.equal(state.parserPerCategory.javascript, 'espree');
    t.end();
});

test('reducers: set parser updates workbench parser', (t) => {
    const state = putoutEditor(getInitState(), setParser(getEspreeParser()));
    
    t.equal(state.workbench.parser, 'espree');
    t.end();
});

test('reducers: select transformer same as current returns same state workbench', (t) => {
    const transformer = {
        id: 'putout',
        defaultParserID: 'babel',
        defaultTransform: '',
    };
    
    const withTransformer = putoutEditor(getInitState(), selectTransformer(transformer));
    const state = putoutEditor(withTransformer, selectTransformer(transformer));
    
    t.equal(state.workbench, withTransformer.workbench);
    t.end();
});

test('reducers: select transformer with different parser', (t) => {
    const transformer = {
        id: 'other',
        defaultParserID: 'espree',
        defaultTransform: '',
    };
    
    const state = putoutEditor(getInitState(), selectTransformer(transformer));
    
    t.equal(state.workbench.parser, 'espree');
    t.end();
});

test('reducers: set transform', (t) => {
    const state = putoutEditor(getInitState(), setTransformState({
        code: 'new transform',
    }));
    
    t.equal(state.workbench.transform.code, 'new transform');
    t.end();
});

test('reducers: parserSettings stores per parser', (t) => {
    const state = putoutEditor(getInitState(), setParserSettings({
        plugins: ['jsx'],
    }));
    
    t.deepEqual(state.parserSettings, {
        babel: {
            plugins: ['jsx'],
        },
    });
    t.end();
});

test('reducers: parserSettings unchanged with active revision', (t) => {
    const rev = makeRevision();
    const withRev = putoutEditor(getInitState(), setSnippet(rev));
    
    const state = putoutEditor(withRev, setParserSettings({
        plugins: ['jsx'],
    }));
    
    t.deepEqual(state.parserSettings, {});
    t.end();
});

test('reducers: set key map', (t) => {
    const state = putoutEditor(getInitState(), setKeyMap('sublime'));
    
    t.equal(state.workbench.keyMap, 'sublime');
    t.end();
});

test('reducers: drop text sets code', (t) => {
    const state = putoutEditor(getInitState(), dropText({
        text: 'dropped code',
        categoryId: 'javascript',
    }));
    
    t.equal(state.workbench.code, 'dropped code');
    t.end();
});

test('reducers: drop text sets initialCode', (t) => {
    const state = putoutEditor(getInitState(), dropText({
        text: 'dropped code',
        categoryId: 'javascript',
    }));
    
    t.equal(state.workbench.initialCode, 'dropped code');
    t.end();
});

test('reducers: select transformer with different transformer and active revision matches', (t) => {
    const rev = makeRevision({
        getTransformerID: () => 'other',
        getTransformCode: () => 'revision transform',
    });
    
    const withRev = putoutEditor(getInitState(), setSnippet(rev));
    
    const transformer = {
        id: 'other',
        defaultParserID: 'babel',
        defaultTransform: 'default transform',
    };
    
    const state = putoutEditor(withRev, selectTransformer(transformer));
    
    t.equal(state.workbench.transform.code, 'revision transform');
    t.end();
});

test('reducers: select transformer with different transformer and active revision not matches', (t) => {
    const rev = makeRevision({
        getTransformerID: () => 'old-id',
        getTransformCode: () => 'revision transform',
    });
    
    const withRev = putoutEditor(getInitState(), setSnippet(rev));
    
    const transformer = {
        id: 'other',
        defaultParserID: 'babel',
        defaultTransform: 'default transform',
    };
    
    const state = putoutEditor(withRev, selectTransformer(transformer));
    
    t.equal(state.workbench.transform.code, 'default transform');
    t.end();
});

test('reducers: select transformer: snippetHasDifferentTransform uses revision initialCode', (t) => {
    const rev = makeRevision({
        getTransformerID: () => 'putout',
        getTransformCode: () => 'revision code',
    });
    
    const init = getInitState();
    const withRev = putoutEditor(init, setSnippet(rev));
    
    const diffTrans = putoutEditor(withRev, selectTransformer({
        id: 'other',
        defaultParserID: 'babel',
        defaultTransform: 'default',
    }));
    
    const state = putoutEditor(diffTrans, selectTransformer({
        id: 'putout',
        defaultParserID: 'babel',
        defaultTransform: 'default',
    }));
    
    t.equal(state.workbench.transform.initialCode, 'revision code');
    t.end();
});

test('reducers: highlightRange defaults to null', (t) => {
    const state = getInitState();
    
    t.notOk(state.highlightRange);
    t.end();
});

test('reducers: setHighlight sets highlightRange', (t) => {
    const state = putoutEditor(getInitState(), setHighlight([0, 5]));
    
    t.deepEqual(state.highlightRange, [0, 5]);
    t.end();
});

test('reducers: clearHighlight with no args sets highlightRange to null', (t) => {
    const withHighlight = putoutEditor(getInitState(), setHighlight([0, 5]));
    const state = putoutEditor(withHighlight, clearHighlight());
    
    t.notOk(state.highlightRange);
    t.end();
});

test('reducers: clearHighlight with matching range clears it', (t) => {
    const withHighlight = putoutEditor(getInitState(), setHighlight([0, 5]));
    const state = putoutEditor(withHighlight, clearHighlight([0, 5]));
    
    t.notOk(state.highlightRange);
    t.end();
});

test('reducers: clearHighlight with non-matching range preserves it', (t) => {
    const withHighlight = putoutEditor(getInitState(), setHighlight([0, 5]));
    const state = putoutEditor(withHighlight, clearHighlight([1, 6]));
    
    t.deepEqual(state.highlightRange, [0, 5]);
    t.end();
});
