import {test} from 'supertape';
import type {FlatNode} from '@putout/editor-commands';
import {
    reducer,
    initialState,
    addMessage,
    pushHistory,
    setSource,
    setPlugin,
    setConsoleAst,
    setHistoryIndex,
    toggleConsole,
    clearThread,
    reset,
    nextId,
} from './slice.ts';

const node = (id: string): FlatNode => ({
    id,
    pid: null,
    depth: 0,
    type: 'Program',
    detail: '',
    line: 1,
    col: 0,
    endLine: 1,
    endCol: 10,
});

const message = (text: string) => ({
    id: nextId(),
    text,
    result: {
        type: 'text' as const,
        data: 'ok',
    },
});

test('slice: starts empty', (t) => {
    const result = reducer(undefined, {
        type: '@@init',
    });
    
    const expected = initialState;
    
    t.deepEqual(result, expected);
    t.end();
});

test('slice: addMessage appends to the thread', (t) => {
    const one = message('a');
    const state = reducer(initialState, addMessage(one));
    
    const result = state.messages.length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('slice: addMessage keeps what went before it', (t) => {
    const one = message('a');
    const two = message('b');
    
    const state = reducer(reducer(
        initialState,
        addMessage(one),
    ), addMessage(two));
    
    const result = [];
    
    for (const {text} of state.messages) {
        result.push(text);
    }
    
    const expected = ['a', 'b'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('slice: pushHistory appends a sent line', (t) => {
    const state = reducer(initialState, pushHistory('/ast'));
    
    const result = state.history;
    const expected = ['/ast'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('slice: setSource replaces the buffer', (t) => {
    const state = reducer(initialState, setSource('const a = 1;'));
    
    const result = state.source;
    const expected = 'const a = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('slice: setPlugin replaces the plugin', (t) => {
    const state = reducer(initialState, setPlugin('export const report = () => "x";'));
    
    const result = state.plugin;
    const expected = 'export const report = () => "x";';
    
    t.equal(result, expected);
    t.end();
});

test('slice: setConsoleAst hands the panel a tree and the source behind it', (t) => {
    const payload = {
        nodes: [
            node('0'),
        ],
        source: 'const a = 1;',
    };
    
    const state = reducer(initialState, setConsoleAst(payload));
    
    const result = state.consoleAst;
    const expected = payload;
    
    t.deepEqual(result, expected);
    t.end();
});

test('slice: toggleConsole opens it', (t) => {
    const state = reducer(initialState, toggleConsole());
    
    const result = state.consoleOpen;
    
    t.ok(result);
    t.end();
});

test('slice: toggleConsole closes it again', (t) => {
    const state = reducer(reducer(
        initialState,
        toggleConsole(),
    ), toggleConsole());
    
    const result = state.consoleOpen;
    
    t.notOk(result);
    t.end();
});

test('slice: clearThread empties the transcript and keeps the source', (t) => {
    const withSource = reducer(initialState, setSource('const a = 1;'));
    const withMessage = reducer(withSource, addMessage(message('/ast')));
    const state = reducer(withMessage, clearThread());
    
    const result = {
        messages: state.messages.length,
        source: state.source,
    };
    
    const expected = {
        messages: 0,
        source: 'const a = 1;',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('slice: reset returns every field to its initial value', (t) => {
    const result = reducer(reducer(
        initialState,
        setSource('const a = 1;'),
    ), reset());
    
    const expected = initialState;
    
    t.deepEqual(result, expected);
    t.end();
});

test('slice: nextId never repeats, so a key on id is stable', (t) => {
    const first = nextId();
    const second = nextId();
    
    const result = first === second;
    
    t.notOk(result);
    t.end();
});

test('slice: setHistoryIndex stores the cursor', (t) => {
    const state = reducer(initialState, setHistoryIndex(2));
    
    const result = state.historyIndex;
    const expected = 2;
    
    t.equal(result, expected);
    t.end();
});

test('slice: pushHistory resets the cursor to the empty box', (t) => {
    const walked = reducer(initialState, setHistoryIndex(2));
    const state = reducer(walked, pushHistory('/ast'));
    
    const result = state.historyIndex;
    const expected = -1;
    
    t.equal(result, expected);
    t.end();
});

test('slice: pushHistory keeps the line it was given', (t) => {
    const state = reducer(initialState, pushHistory('/ast'));
    
    const result = state.history;
    const expected = ['/ast'];
    
    t.deepEqual(result, expected);
    t.end();
});
