import {test} from 'supertape';
import {
    canFork,
    getCursor,
    getError,
    isLoadingSnippet,
    showSettingsDialog,
    showShareDialog,
    isForking,
    isSaving,
    getParserSettings,
    getParseResult,
    getRevision,
    getCode,
    getInitialCode,
    getKeyMap,
    getTransformCode,
    getInitialTransformCode,
    showTransformer,
    canSaveCode,
    canSaveTransform,
    getHighlightRange,
} from './selectors.js';

test('selectors: canFork: no revision: false', (t) => {
    const result = canFork({
        activeRevision: null,
    });
    
    t.notOk(result);
    t.end();
});

test('selectors: canFork: with revision: true', (t) => {
    const result = canFork({
        activeRevision: {
            id: '1',
        },
    });
    
    t.ok(result);
    t.end();
});


test('selectors: getCursor', (t) => {
    const result = getCursor({
        cursor: 3,
    });
    
    t.equal(result, 3);
    t.end();
});

test('selectors: getError', (t) => {
    const result = getError({
        error: 'err',
    });
    
    t.equal(result, 'err');
    t.end();
});

test('selectors: isLoadingSnippet', (t) => {
    const result = isLoadingSnippet({
        loadingSnippet: false,
    });
    
    t.notOk(result);
    t.end();
});

test('selectors: showSettingsDialog', (t) => {
    const result = showSettingsDialog({
        showSettingsDialog: true,
    });
    
    t.ok(result);
    t.end();
});

test('selectors: showShareDialog', (t) => {
    const result = showShareDialog({
        showShareDialog: false,
    });
    
    t.notOk(result);
    t.end();
});

test('selectors: isForking', (t) => {
    const result = isForking({
        forking: true,
    });
    
    t.ok(result);
    t.end();
});

test('selectors: isSaving', (t) => {
    const result = isSaving({
        saving: false,
    });
    
    t.notOk(result);
    t.end();
});

test('selectors: getParserSettings', (t) => {
    const result = getParserSettings({
        workbench: {
            parserSettings: {
                a: 1,
            },
        },
    });
    
    const expected = {
        a: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('selectors: getParseResult', (t) => {
    const result = getParseResult({
        workbench: {
            parseResult: {
                ast: null,
            },
        },
    });
    
    const expected = {
        ast: null,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('selectors: getRevision', (t) => {
    const result = getRevision({
        activeRevision: null,
    });
    
    t.notOk(result);
    t.end();
});

test('selectors: getCode', (t) => {
    const result = getCode({
        workbench: {
            code: 'a',
        },
    });
    
    t.equal(result, 'a');
    t.end();
});

test('selectors: getInitialCode', (t) => {
    const result = getInitialCode({
        workbench: {
            initialCode: 'b',
        },
    });
    
    t.equal(result, 'b');
    t.end();
});

test('selectors: getKeyMap', (t) => {
    const result = getKeyMap({
        workbench: {
            keyMap: {
                k: 1,
            },
        },
    });
    
    const expected = {
        k: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('selectors: getTransformCode', (t) => {
    const result = getTransformCode({
        workbench: {
            transform: {
                code: 't',
            },
        },
    });
    
    t.equal(result, 't');
    t.end();
});

test('selectors: getInitialTransformCode', (t) => {
    const result = getInitialTransformCode({
        workbench: {
            transform: {
                initialCode: 'ti',
            },
        },
    });
    
    t.equal(result, 'ti');
    t.end();
});

test('selectors: showTransformer', (t) => {
    const result = showTransformer({
        showTransformPanel: true,
    });
    
    t.ok(result);
    t.end();
});

test('selectors: canSaveCode no revision', (t) => {
    const result = canSaveCode({
        activeRevision: null,
        workbench: {
            code: 'a',
            initialCode: 'a',
        },
    });
    
    t.ok(result);
    t.end();
});

test('selectors: canSaveCode dirty', (t) => {
    const s = {
        activeRevision: {
            id: '1',
        },
        workbench: {
            code: 'a',
            initialCode: 'b',
        },
    };
    
    const result = canSaveCode(s);
    
    t.ok(result);
    t.end();
});

test('selectors: canSaveCode not dirty', (t) => {
    const s = {
        activeRevision: {
            id: '1',
        },
        workbench: {
            code: 'a',
            initialCode: 'a',
        },
    };
    
    const result = canSaveCode(s);
    
    t.notOk(result);
    t.end();
});

test('selectors: canSaveTransform true', (t) => {
    const s = {
        showTransformPanel: true,
        workbench: {
            transform: {
                code: 'a',
                initialCode: 'b',
            },
        },
    };
    
    const result = canSaveTransform(s);
    
    t.ok(result);
    t.end();
});

test('selectors: canSaveTransform not dirty', (t) => {
    const s = {
        showTransformPanel: true,
        workbench: {
            transform: {
                code: 'a',
                initialCode: 'a',
            },
        },
    };
    
    const result = canSaveTransform(s);
    
    t.notOk(result);
    t.end();
});

test('selectors: canSaveTransform panel hidden', (t) => {
    const s = {
        showTransformPanel: false,
        workbench: {
            transform: {
                code: 'a',
                initialCode: 'b',
            },
        },
    };
    
    const result = canSaveTransform(s);
    
    t.notOk(result);
    t.end();
});

test('selectors: getHighlightRange returns range', (t) => {
    const result = getHighlightRange({
        highlightRange: [1, 2],
    });
    
    const expected = [1, 2];
    
    t.deepEqual(result, expected);
    t.end();
});

test('selectors: getHighlightRange returns null when not set', (t) => {
    const result = getHighlightRange({
        highlightRange: null,
    });
    
    t.notOk(result);
    t.end();
});
