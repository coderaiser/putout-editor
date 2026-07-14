import {test} from 'supertape';
import * as actions from './actions.js';

// one assertion per test enforced by supertape
test('actions: setParser', (t) => {
    const parser = {
        name: 'p',
    };
    
    const result = actions.setParser(parser);
    
    const expected = {
        type: actions.SET_PARSER,
        parser,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: setParserSettings', (t) => {
    const settings = {
        a: 1,
    };
    
    const result = actions.setParserSettings(settings);
    
    const expected = {
        type: actions.SET_PARSER_SETTINGS,
        settings,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: save', (t) => {
    const result = actions.save(true);
    const expected = {
        type: actions.SAVE,
        fork: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: save default', (t) => {
    t.deepEqual(actions.save(), {
        type: actions.SAVE,
        fork: false,
    });
    t.end();
});

test('actions: startSave', (t) => {
    const result = actions.startSave(false);
    const expected = {
        type: actions.START_SAVE,
        fork: false,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: endSave', (t) => {
    const result = actions.endSave(false);
    const expected = {
        type: actions.END_SAVE,
        fork: false,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: setSnippet', (t) => {
    const result = actions.setSnippet('r1');
    const expected = {
        type: actions.SET_SNIPPET,
        revision: 'r1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: clearSnippet', (t) => {
    t.deepEqual(actions.clearSnippet(), {
        type: actions.CLEAR_SNIPPET,
    });
    t.end();
});

test('actions: startLoadingSnippet', (t) => {
    t.deepEqual(actions.startLoadingSnippet(), {
        type: actions.START_LOADING_SNIPPET,
    });
    t.end();
});

test('actions: doneLoadingSnippet', (t) => {
    t.deepEqual(actions.doneLoadingSnippet(), {
        type: actions.DONE_LOADING_SNIPPET,
    });
    t.end();
});

test('actions: loadSnippet', (t) => {
    t.deepEqual(actions.loadSnippet(), {
        type: actions.LOAD_SNIPPET,
    });
    t.end();
});

test('actions: openSettingsDialog', (t) => {
    t.deepEqual(actions.openSettingsDialog(), {
        type: actions.OPEN_SETTINGS_DIALOG,
    });
    t.end();
});

test('actions: closeSettingsDialog', (t) => {
    t.deepEqual(actions.closeSettingsDialog(), {
        type: actions.CLOSE_SETTINGS_DIALOG,
    });
    t.end();
});

test('actions: openShareDialog', (t) => {
    t.deepEqual(actions.openShareDialog(), {
        type: actions.OPEN_SHARE_DIALOG,
    });
    t.end();
});

test('actions: closeShareDialog', (t) => {
    t.deepEqual(actions.closeShareDialog(), {
        type: actions.CLOSE_SHARE_DIALOG,
    });
    t.end();
});

test('actions: setError', (t) => {
    const err = Error('boom');
    const result = actions.setError(err);
    
    const expected = {
        type: actions.SET_ERROR,
        error: err,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: clearError', (t) => {
    t.deepEqual(actions.clearError(), {
        type: actions.CLEAR_ERROR,
    });
    t.end();
});

test('actions: selectTransformer', (t) => {
    const tr = {
        id: 1,
    };
    
    const result = actions.selectTransformer(tr);
    
    const expected = {
        type: actions.SELECT_TRANSFORMER,
        transformer: tr,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: hideTransformer', (t) => {
    t.deepEqual(actions.hideTransformer(), {
        type: actions.HIDE_TRANSFORMER,
    });
    t.end();
});

test('actions: setTransformState', (t) => {
    const result = actions.setTransformState({
        a: 1,
    });
    
    const expected = {
        type: actions.SET_TRANSFORM,
        a: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: setCode', (t) => {
    const result = actions.setCode({
        code: 'x',
    });
    
    const expected = {
        type: actions.SET_CODE,
        code: 'x',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: setCursor', (t) => {
    const result = actions.setCursor(5);
    const expected = {
        type: actions.SET_CURSOR,
        cursor: 5,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: dropText', (t) => {
    t.deepEqual(actions.dropText('txt', 'cat'), {
        type: actions.DROP_TEXT,
        text: 'txt',
        categoryId: 'cat',
    });
    t.end();
});

test('actions: reset', (t) => {
    t.deepEqual(actions.reset(), {
        type: actions.RESET,
    });
    t.end();
});

test('actions: toggleFormatting', (t) => {
    t.deepEqual(actions.toggleFormatting(), {
        type: actions.TOGGLE_FORMATTING,
    });
    t.end();
});

test('actions: setKeyMap', (t) => {
    const result = actions.setKeyMap({
        map: true,
    });
    
    const expected = {
        type: actions.SET_KEY_MAP,
        keyMap: {
            map: true,
        },
    };
    
    t.deepEqual(result, expected);
    t.end();
});
