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
    const result = actions.save();
    const expected = {
        type: actions.SAVE,
        fork: false,
    };
    
    t.deepEqual(result, expected);
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
    const result = actions.clearSnippet();
    const expected = {
        type: actions.CLEAR_SNIPPET,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: startLoadingSnippet', (t) => {
    const result = actions.startLoadingSnippet();
    const expected = {
        type: actions.START_LOADING_SNIPPET,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: doneLoadingSnippet', (t) => {
    const result = actions.doneLoadingSnippet();
    const expected = {
        type: actions.DONE_LOADING_SNIPPET,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: loadSnippet', (t) => {
    const result = actions.loadSnippet();
    const expected = {
        type: actions.LOAD_SNIPPET,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: openSettingsDialog', (t) => {
    const result = actions.openSettingsDialog();
    const expected = {
        type: actions.OPEN_SETTINGS_DIALOG,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: closeSettingsDialog', (t) => {
    const result = actions.closeSettingsDialog();
    const expected = {
        type: actions.CLOSE_SETTINGS_DIALOG,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: openShareDialog', (t) => {
    const result = actions.openShareDialog();
    const expected = {
        type: actions.OPEN_SHARE_DIALOG,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: closeShareDialog', (t) => {
    const result = actions.closeShareDialog();
    const expected = {
        type: actions.CLOSE_SHARE_DIALOG,
    };
    
    t.deepEqual(result, expected);
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
    const result = actions.clearError();
    const expected = {
        type: actions.CLEAR_ERROR,
    };
    
    t.deepEqual(result, expected);
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
    const result = actions.hideTransformer();
    const expected = {
        type: actions.HIDE_TRANSFORMER,
    };
    
    t.deepEqual(result, expected);
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
    const result = actions.dropText('txt', 'cat');
    const expected = {
        type: actions.DROP_TEXT,
        text: 'txt',
        categoryId: 'cat',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: reset', (t) => {
    const result = actions.reset();
    const expected = {
        type: actions.RESET,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('actions: toggleFormatting', (t) => {
    const result = actions.toggleFormatting();
    const expected = {
        type: actions.TOGGLE_FORMATTING,
    };
    
    t.deepEqual(result, expected);
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
