import {test} from 'supertape';
import {
    astexplorer,
    persist,
    revive,
} from './reducers.js';
import * as actions from './actions.js';

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
    const state = astexplorer(undefined, {
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
    const state = astexplorer(getInitState(), actions.openSettingsDialog());
    
    t.ok(state.showSettingsDialog);
    t.end();
});

test('reducers: close settings dialog', (t) => {
    const open = astexplorer(getInitState(), actions.openSettingsDialog());
    const state = astexplorer(open, actions.closeSettingsDialog());
    
    t.notOk(state.showSettingsDialog);
    t.end();
});

test('reducers: open share dialog', (t) => {
    const state = astexplorer(getInitState(), actions.openShareDialog());
    
    t.ok(state.showShareDialog);
    t.end();
});

test('reducers: close share dialog', (t) => {
    const open = astexplorer(getInitState(), actions.openShareDialog());
    const state = astexplorer(open, actions.closeShareDialog());
    
    t.notOk(state.showShareDialog);
    t.end();
});

test('reducers: start loading snippet', (t) => {
    const state = astexplorer(getInitState(), actions.startLoadingSnippet());
    
    t.ok(state.loadingSnippet);
    t.end();
});

test('reducers: done loading snippet', (t) => {
    const loading = astexplorer(getInitState(), actions.startLoadingSnippet());
    const state = astexplorer(loading, actions.doneLoadingSnippet());
    
    t.notOk(state.loadingSnippet);
    t.end();
});

test('reducers: start save not fork sets saving', (t) => {
    const state = astexplorer(getInitState(), actions.startSave(false));
    
    t.ok(state.saving);
    t.end();
});

test('reducers: start save not fork unsets forking', (t) => {
    const state = astexplorer(getInitState(), actions.startSave(false));
    
    t.notOk(state.forking);
    t.end();
});

test('reducers: start save with fork sets forking', (t) => {
    const state = astexplorer(getInitState(), actions.startSave(true));
    
    t.ok(state.forking);
    t.end();
});

test('reducers: start save with fork unsets saving', (t) => {
    const state = astexplorer(getInitState(), actions.startSave(true));
    
    t.notOk(state.saving);
    t.end();
});

test('reducers: end save unsets saving', (t) => {
    const saving = astexplorer(getInitState(), actions.startSave(false));
    const state = astexplorer(saving, actions.endSave(false));
    
    t.notOk(state.saving);
    t.end();
});

test('reducers: set cursor', (t) => {
    const state = astexplorer(getInitState(), actions.setCursor(10));
    
    t.equal(state.cursor, 10);
    t.end();
});

test('reducers: set code with cursor', (t) => {
    const state = astexplorer(getInitState(), actions.setCode({
        code: 'new',
        cursor: 5,
    }));
    
    t.equal(state.cursor, 5);
    t.end();
});

test('reducers: set code with null cursor keeps previous', (t) => {
    const setCursor = astexplorer(getInitState(), actions.setCursor(3));
    const state = astexplorer(setCursor, actions.setCode({
        code: 'new',
        cursor: 0,
    }));
    
    t.equal(state.cursor, 3);
    t.end();
});

test('reducers: reset sets cursor to null', (t) => {
    const setCursor = astexplorer(getInitState(), actions.setCursor(3));
    const state = astexplorer(setCursor, actions.reset());
    
    t.notOk(state.cursor);
    t.end();
});

test('reducers: set snippet sets cursor to null', (t) => {
    const setCursor = astexplorer(getInitState(), actions.setCursor(3));
    const state = astexplorer(setCursor, actions.setSnippet(makeRevision()));
    
    t.notOk(state.cursor);
    t.end();
});

test('reducers: clear snippet sets cursor to null', (t) => {
    const setCursor = astexplorer(getInitState(), actions.setCursor(3));
    const state = astexplorer(setCursor, actions.clearSnippet());
    
    t.notOk(state.cursor);
    t.end();
});

test('reducers: set error', (t) => {
    const state = astexplorer(getInitState(), actions.setError(Error('test error')));
    
    t.ok(state.error);
    t.end();
});

test('reducers: set error message', (t) => {
    const state = astexplorer(getInitState(), actions.setError(Error('test error')));
    
    t.equal(state.error.message, 'test error');
    t.end();
});

test('reducers: clear error', (t) => {
    const errState = astexplorer(getInitState(), actions.setError(Error('test error')));
    const state = astexplorer(errState, actions.clearError());
    
    t.notOk(state.error);
    t.end();
});

test('reducers: toggle formatting enables', (t) => {
    const state = astexplorer(getInitState(), actions.toggleFormatting());
    
    t.ok(state.enableFormatting);
    t.end();
});

test('reducers: toggle formatting disables', (t) => {
    const enabled = astexplorer(getInitState(), actions.toggleFormatting());
    const state = astexplorer(enabled, actions.toggleFormatting());
    
    t.notOk(state.enableFormatting);
    t.end();
});

test('reducers: select transformer shows transform panel', (t) => {
    const transformer = {
        id: 'putout',
        defaultParserID: 'babel',
        defaultTransform: '',
    };
    const state = astexplorer(getInitState(), actions.selectTransformer(transformer));
    
    t.ok(state.showTransformPanel);
    t.end();
});

test('reducers: hide transformer returns true', (t) => {
    const state = astexplorer(getInitState(), actions.hideTransformer());
    
    t.ok(state.showTransformPanel);
    t.end();
});

test('reducers: set snippet with transformer shows transform panel', (t) => {
    const rev = makeRevision({
        getTransformerID: () => 'putout',
    });
    const state = astexplorer(getInitState(), actions.setSnippet(rev));
    
    t.ok(state.showTransformPanel);
    t.end();
});

test('reducers: set snippet without transformer hides transform panel', (t) => {
    const rev = makeRevision({
        getTransformerID: () => null,
    });
    const state = astexplorer(getInitState(), actions.setSnippet(rev));
    
    t.notOk(state.showTransformPanel);
    t.end();
});

test('reducers: set snippet sets activeRevision', (t) => {
    const rev = makeRevision();
    const state = astexplorer(getInitState(), actions.setSnippet(rev));
    
    t.equal(state.activeRevision, rev);
    t.end();
});

test('reducers: clear snippet clears activeRevision', (t) => {
    const rev = makeRevision();
    const withRev = astexplorer(getInitState(), actions.setSnippet(rev));
    const state = astexplorer(withRev, actions.clearSnippet());
    
    t.notOk(state.activeRevision);
    t.end();
});

test('reducers: reset clears activeRevision', (t) => {
    const rev = makeRevision();
    const withRev = astexplorer(getInitState(), actions.setSnippet(rev));
    const state = astexplorer(withRev, actions.reset());
    
    t.notOk(state.activeRevision);
    t.end();
});

test('reducers: select category clears activeRevision', (t) => {
    const rev = makeRevision();
    const withRev = astexplorer(getInitState(), actions.setSnippet(rev));
    const state = astexplorer(withRev, {
        type: actions.SELECT_CATEGORY,
        category: getCategory(),
    });
    
    t.notOk(state.activeRevision);
    t.end();
});

test('reducers: set code', (t) => {
    const state = astexplorer(getInitState(), actions.setCode({
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
    const state = astexplorer(getInitState(), {
        type: actions.SET_PARSE_RESULT,
        result,
    });
    
    t.equal(state.workbench.parseResult, result);
    t.end();
});

test('reducers: set parser settings on workbench', (t) => {
    const state = astexplorer(getInitState(), actions.setParserSettings({
        plugins: ['jsx'],
    }));
    t.deepEqual(state.workbench.parserSettings, {
        plugins: ['jsx'],
    });
    t.end();
});

test('reducers: set parser stores per category', (t) => {
    const state = astexplorer(getInitState(), actions.setParser(getEspreeParser()));
    
    t.equal(state.parserPerCategory.javascript, 'espree');
    t.end();
});

test('reducers: set parser updates workbench parser', (t) => {
    const state = astexplorer(getInitState(), actions.setParser(getEspreeParser()));
    
    t.equal(state.workbench.parser, 'espree');
    t.end();
});

test('reducers: select transformer same as current returns same state workbench', (t) => {
    const transformer = {
        id: 'putout',
        defaultParserID: 'babel',
        defaultTransform: '',
    };
    const withTransformer = astexplorer(getInitState(), actions.selectTransformer(transformer));
    const state = astexplorer(withTransformer, actions.selectTransformer(transformer));
    
    t.equal(state.workbench, withTransformer.workbench);
    t.end();
});

test('reducers: select transformer with different parser', (t) => {
    const transformer = {
        id: 'other',
        defaultParserID: 'espree',
        defaultTransform: '',
    };
    const state = astexplorer(getInitState(), actions.selectTransformer(transformer));
    
    t.equal(state.workbench.parser, 'espree');
    t.end();
});

test('reducers: set transform', (t) => {
    const state = astexplorer(getInitState(), actions.setTransformState({
        code: 'new transform',
    }));
    
    t.equal(state.workbench.transform.code, 'new transform');
    t.end();
});

test('reducers: parserSettings stores per parser', (t) => {
    const state = astexplorer(getInitState(), actions.setParserSettings({
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
    const withRev = astexplorer(getInitState(), actions.setSnippet(rev));
    const state = astexplorer(withRev, actions.setParserSettings({
        plugins: ['jsx'],
    }));
    
    t.deepEqual(state.parserSettings, {});
    t.end();
});

test('reducers: set key map', (t) => {
    const state = astexplorer(getInitState(), actions.setKeyMap('sublime'));
    
    t.equal(state.workbench.keyMap, 'sublime');
    t.end();
});

test('reducers: drop text sets code', (t) => {
    const state = astexplorer(getInitState(), actions.dropText('dropped code', 'javascript'));
    
    t.equal(state.workbench.code, 'dropped code');
    t.end();
});

test('reducers: drop text sets initialCode', (t) => {
    const state = astexplorer(getInitState(), actions.dropText('dropped code', 'javascript'));
    
    t.equal(state.workbench.initialCode, 'dropped code');
    t.end();
});

test('reducers: select transformer with different transformer and active revision matches', (t) => {
    const rev = makeRevision({
        getTransformerID: () => 'other',
        getTransformCode: () => 'revision transform',
    });
    const withRev = astexplorer(getInitState(), actions.setSnippet(rev));
    const transformer = {
        id: 'other',
        defaultParserID: 'babel',
        defaultTransform: 'default transform',
    };
    const state = astexplorer(withRev, actions.selectTransformer(transformer));
    
    t.equal(state.workbench.transform.code, 'revision transform');
    t.end();
});

test('reducers: select transformer with different transformer and active revision not matches', (t) => {
    const rev = makeRevision({
        getTransformerID: () => 'old-id',
        getTransformCode: () => 'revision transform',
    });
    const withRev = astexplorer(getInitState(), actions.setSnippet(rev));
    const transformer = {
        id: 'other',
        defaultParserID: 'babel',
        defaultTransform: 'default transform',
    };
    const state = astexplorer(withRev, actions.selectTransformer(transformer));
    
    t.equal(state.workbench.transform.code, 'default transform');
    t.end();
});

test('reducers: select transformer: snippetHasDifferentTransform uses revision initialCode', (t) => {
    const rev = makeRevision({
        getTransformerID: () => 'putout',
        getTransformCode: () => 'revision code',
    });
    const init = getInitState();
    const withRev = astexplorer(init, actions.setSnippet(rev));
    const diffTrans = astexplorer(withRev, actions.selectTransformer({
        id: 'other',
        defaultParserID: 'babel',
        defaultTransform: 'default',
    }));
    const state = astexplorer(diffTrans, actions.selectTransformer({
        id: 'putout',
        defaultParserID: 'babel',
        defaultTransform: 'default',
    }));
    
    t.equal(state.workbench.transform.initialCode, 'revision code');
    t.end();
});
