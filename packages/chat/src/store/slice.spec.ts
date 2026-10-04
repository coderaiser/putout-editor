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
    openConsole,
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

/**
 * The reducer's own `initialState`, which is **not** an empty thread.
 *
 * Renamed from "starts empty": it still pins the same thing — the reducer hands
 * back the state object it was given — and the name said more than that.
 */
test('slice: starts on the seeded thread', (t) => {
    const result = reducer(undefined, {
        type: '@@init',
    });
    
    const expected = initialState;
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `expected` is *relative* to the seed, not a literal.
 *
 * These two used to assert `1` and `['a', 'b']` against an empty thread. The
 * thread is no longer empty — it opens with a worked `source` example and the
 * help — so a hard-coded count would be asserting the old start screen rather
 * than the appending. Building it from `initialState.messages` keeps the test
 * about the one thing it is named for and lets the seed change without it.
 */
test('slice: addMessage appends to the thread', (t) => {
    const one = message('a');
    const state = reducer(initialState, addMessage(one));
    
    const result = state.messages.length;
    const expected = initialState.messages.length + 1;
    
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
    
    for (const {text} of state.messages)
        result.push(text);
    
    const seeded = [];
    
    for (const {text} of initialState.messages)
        seeded.push(text);
    
    const expected = [
        ...seeded,
        'a',
        'b',
    ];
    
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

test('slice: openConsole opens it', (t) => {
    const state = reducer(initialState, openConsole());
    
    const result = state.consoleOpen;
    
    t.ok(result);
    t.end();
});

test('slice: openConsole on an open panel leaves it open', (t) => {
    // The point of a separate action: `/ast` twice must not close the panel,
    // which is what `toggleConsole` here would do.
    const state = reducer(reducer(
        initialState,
        openConsole(),
    ), openConsole());
    
    const result = state.consoleOpen;
    
    t.ok(result);
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

/**
 * The opening thread, which is the whole of "the user understands the tool
 * without reading anything".
 *
 * plan.md: "start screen shows that `source` command already used with
 * 'Replacer' example from putout-editor, it must show user input and command
 * output in chat, and help". Two messages, both of them *echoed* — a user has
 * to see that what they type comes back, or the first line of the thread is
 * indistinguishable from static text.
 */
test('slice: opens with a worked source example and the help', (t) => {
    const result = [];
    
    for (const {text} of initialState.messages)
        result.push(text.split('\n')[0]);
    
    const expected = [
        'source',
        'help',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('slice: the seeded source is the buffer, not a copy that can drift', (t) => {
    const [first] = initialState.messages;
    const result = first.result && first.result.type === 'source' && first.result.data;
    const expected = initialState.source;
    
    t.equal(result, expected);
    t.end();
});

/**
 * The example is a **working** 🐊Putout rule, not a `const`.
 *
 * It is the `replacer` template from `packages/client`, copied rather than
 * imported: `config/boundaries-config.ts` does not let `chat` reach `client`'s
 * snippet tree. A user who opens this page and types `ast` gets a tree with a
 * `report` and a `replace` in it — the two halves of a rule — which is what
 * makes the first `ast` worth typing.
 */
test('slice: the seeded source is a rule with a report and a replace', (t) => {
    const result = {
        report: initialState.source.includes('report'),
        replace: initialState.source.includes('replace'),
    };
    
    const expected = {
        report: true,
        replace: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The echo is the *multi-line* input, not the command name alone.
 *
 * A user has to see that the command word and the body are one thing they typed
 * and one thing the tool answers, and that the body is multi-line — otherwise
 * `source` looks like it takes a one-line argument and `ast` on a real snippet
 * is a surprise.
 */
test('slice: the seeded source echoes the command and its body', (t) => {
    const [first] = initialState.messages;
    const result = first.text.startsWith('source\n');
    
    t.ok(result);
    t.end();
});

test('slice: the seeded help answer is the command list', (t) => {
    const [, second] = initialState.messages;
    const data = second.result && second.result.type === 'text' ? second.result.data : '';
    const result = data.includes('source [source]');
    
    t.ok(result);
    t.end();
});
