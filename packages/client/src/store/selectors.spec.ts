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
} from './selectors.ts';
import {putoutEditor, type RootState} from './reducers.ts';

function makeState(overrides: Record<string, any> = {}): RootState {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    if (!overrides.workbench)
        return {
            ...base,
            ...overrides,
        } as RootState;
    
    return {
        ...base,
        ...overrides,
        workbench: {
            ...base.workbench,
            ...overrides.workbench,
        },
    } as RootState;
}

test('selectors: canFork: no revision: false', (t) => {
    const result = canFork(makeState({
        activeRevision: null,
    }));
    
    t.notOk(result);
    t.end();
});

test('selectors: canFork: with revision: true', (t) => {
    const result = canFork(makeState({
        activeRevision: {
            id: '1',
        },
    }));
    
    t.ok(result);
    t.end();
});

test('selectors: getCursor', (t) => {
    const result = getCursor(makeState({
        cursor: 3,
    }));
    
    t.equal(result, 3);
    t.end();
});

test('selectors: getError', (t) => {
    const result = getError(makeState({
        error: 'err',
    }));
    
    t.equal(result, 'err');
    t.end();
});

test('selectors: isLoadingSnippet', (t) => {
    const result = isLoadingSnippet(makeState({
        loadingSnippet: false,
    }));
    
    t.notOk(result);
    t.end();
});

test('selectors: showSettingsDialog', (t) => {
    const result = showSettingsDialog(makeState({
        showSettingsDialog: true,
    }));
    
    t.ok(result);
    t.end();
});

test('selectors: showShareDialog', (t) => {
    const result = showShareDialog(makeState({
        showShareDialog: false,
    }));
    
    t.notOk(result);
    t.end();
});

test('selectors: isForking', (t) => {
    const result = isForking(makeState({
        forking: true,
    }));
    
    t.ok(result);
    t.end();
});

test('selectors: isSaving', (t) => {
    const result = isSaving(makeState({
        saving: false,
    }));
    
    t.notOk(result);
    t.end();
});

test('selectors: getParserSettings', (t) => {
    const result = getParserSettings(makeState({
        workbench: {
            parserSettings: {
                a: 1,
            },
        },
    }));
    
    const expected = {
        a: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('selectors: getParseResult', (t) => {
    const result = getParseResult(makeState({
        workbench: {
            parseResult: {
                ast: null,
            },
        },
    }));
    
    const expected = {
        ast: null,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('selectors: getRevision', (t) => {
    const result = getRevision(makeState({
        activeRevision: null,
    }));
    
    t.notOk(result);
    t.end();
});

test('selectors: getCode', (t) => {
    const result = getCode(makeState({
        workbench: {
            code: 'a',
        },
    }));
    
    t.equal(result, 'a');
    t.end();
});

test('selectors: getInitialCode', (t) => {
    const result = getInitialCode(makeState({
        workbench: {
            initialCode: 'b',
        },
    }));
    
    t.equal(result, 'b');
    t.end();
});

test('selectors: getKeyMap', (t) => {
    const result = getKeyMap(makeState({
        workbench: {
            keyMap: {
                k: 1,
            },
        },
    }));
    
    const expected = {
        k: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('selectors: getTransformCode', (t) => {
    const result = getTransformCode(makeState({
        workbench: {
            transform: {
                code: 't',
            },
        },
    }));
    
    t.equal(result, 't');
    t.end();
});

test('selectors: getInitialTransformCode', (t) => {
    const result = getInitialTransformCode(makeState({
        workbench: {
            transform: {
                initialCode: 'ti',
            },
        },
    }));
    
    t.equal(result, 'ti');
    t.end();
});

test('selectors: showTransformer', (t) => {
    const result = showTransformer(makeState({
        showTransformPanel: true,
    }));
    
    t.ok(result);
    t.end();
});

test('selectors: canSaveCode no revision', (t) => {
    const result = canSaveCode(makeState({
        activeRevision: null,
        workbench: {
            code: 'a',
            initialCode: 'a',
        },
    }));
    
    t.ok(result);
    t.end();
});

test('selectors: canSaveCode dirty', (t) => {
    const result = canSaveCode(makeState({
        activeRevision: {
            id: '1',
        },
        workbench: {
            code: 'a',
            initialCode: 'b',
        },
    }));
    
    t.ok(result);
    t.end();
});

test('selectors: canSaveCode not dirty', (t) => {
    const result = canSaveCode(makeState({
        activeRevision: {
            id: '1',
        },
        workbench: {
            code: 'a',
            initialCode: 'a',
        },
    }));
    
    t.notOk(result);
    t.end();
});

test('selectors: canSaveTransform true', (t) => {
    const result = canSaveTransform(makeState({
        showTransformPanel: true,
        workbench: {
            transform: {
                code: 'a',
                initialCode: 'b',
            },
        },
    }));
    
    t.ok(result);
    t.end();
});

test('selectors: canSaveTransform not dirty', (t) => {
    const result = canSaveTransform(makeState({
        showTransformPanel: true,
        workbench: {
            transform: {
                code: 'a',
                initialCode: 'a',
            },
        },
    }));
    
    t.notOk(result);
    t.end();
});

test('selectors: canSaveTransform panel hidden', (t) => {
    const result = canSaveTransform(makeState({
        showTransformPanel: false,
        workbench: {
            transform: {
                code: 'a',
                initialCode: 'b',
            },
        },
    }));
    
    t.notOk(result);
    t.end();
});

test('selectors: getHighlightRange returns range', (t) => {
    const result = getHighlightRange(makeState({
        highlightRange: [1, 2],
    }));
    
    const expected = [1, 2];
    
    t.deepEqual(result, expected);
    t.end();
});

test('selectors: getHighlightRange returns null when not set', (t) => {
    const result = getHighlightRange(makeState({
        highlightRange: null,
    }));
    
    t.notOk(result);
    t.end();
});
