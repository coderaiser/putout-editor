import {test} from 'supertape';
import {renderHook, act} from '@testing-library/react';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import type {Store} from '@reduxjs/toolkit';
import {makeStore} from '#test/store';
import type {RootState} from '#store/types';
import {initialState, INITIAL_SOURCE} from '#store';
import {useChat} from './useChat.ts';

type ChatStore = Store<RootState>;

const wrap = (store: Store) => ({children}: {children: ReactNode;}) => (
    <Provider store={store}>
        {children}
    </Provider>
);

/**
 * `overrides` is how a spec asks for a state the seed no longer gives by
 * default — an empty `source`, mostly. Before the seed, `setup()` started with
 * `''` and "no source" was the default; now it is a choice, and a spec that
 * wants it has to say so rather than inherit it by accident.
 */
const setup = (overrides: Parameters<typeof makeStore>[0] = {}) => {
    const store = makeStore(overrides);
    const wrapper = wrap(store);
    
    const {result} = renderHook(() => useChat(), {
        wrapper,
    });
    
    return {
        store,
        result,
        send: async (input: string) => {
            await act(async () => {
                await result.current.send(input);
            });
        },
    };
};

const texts = (store: ChatStore): string[] => store
    .getState()
    .chat
    .messages
    .map(({text}) => text);

test('useChat: source sets the buffer and answers', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;');
    
    const result = store.getState().chat.source;
    const expected = 'const a = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: source records the line in the thread', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;');
    
    const result = texts(store);
    const expected = ['source\nconst a = 1;'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useChat: a sent line goes into the history', async (t) => {
    const {store, send} = setup();
    
    await send('help');
    
    const result = store.getState().chat.history;
    const expected = ['help'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useChat: ast hands the console panel a tree', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;');
    await send('ast');
    
    const result = store.getState().chat.consoleAst && store.getState().chat.consoleAst.source;
    const expected = 'const a = 1;';
    
    t.equal(result, expected);
    t.end();
});

/**
 * Reverses `0e987ac`. Its reason was that the header button left the user to
 * type `/console` to see what they had just asked for — and the answer to that
 * is the tree in the *thread*, which `AstBlock` has always rendered. The panel
 * is a second view of something already on screen.
 */
test('useChat: ast leaves the console panel closed', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;');
    await send('ast');
    
    const result = store.getState().chat.consoleOpen;
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: ast twice still leaves the console panel closed', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;');
    await send('ast');
    await send('ast');
    
    const result = store.getState().chat.consoleOpen;
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: ast with no source does not open the panel', async (t) => {
    const {store, send} = setup({
        source: '',
    });
    
    await send('ast');
    
    const result = store.getState().chat.consoleOpen;
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});

/**
 * The seed, asserted by what it does rather than by what it is.
 *
 * `source !== ''` would pass on any non-empty string, including one that does
 * not parse — and the failure this guards against is exactly that: `/ast`
 * answering "no source" on a fresh page. So both halves are here: the text is
 * the one `initialState` declares, and the test after it is the one that
 * matters, because it is the only one that would notice a seed which does not
 * parse.
 */
test('useChat: the source starts as the seed the slice declares', (t) => {
    const {store} = setup();
    
    const result = store.getState().chat.source;
    const expected = initialState.source;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: ast on a fresh page answers with a tree', async (t) => {
    const {store, send} = setup();
    
    await send('ast');
    
    // `messages.at(-1)` rather than the last message by index, and bound before
    
    // the `?.` — the root `.putout.json` turns on
    
    // `optional-chaining/convert-optional-to-logical`, and the fixer would
    
    // rewrite this to `&&`, which does not narrow and hands the typing back.
    const {messages} = store.getState().chat;
    const [last] = messages.slice(-1);
    const result = last.result && last.result.type;
    const expected = 'ast';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: ast on a fresh page answers with a tree, not an error', async (t) => {
    const {store, send} = setup();
    
    await send('ast');
    
    const result = store.getState().chat.consoleAst !== null;
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: /console toggles the panel', async (t) => {
    const {store, send} = setup();
    
    await send('console');
    
    const result = store.getState().chat.consoleOpen;
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: /clear empties the thread but keeps the source', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;');
    await send('clear');
    
    const result = {
        messages: store.getState().chat.messages.length,
        source: store.getState().chat.source,
    };
    
    const expected = {
        messages: 0,
        source: 'const a = 1;',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useChat: /reset puts the seed back, not an empty source', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;');
    await send('reset');
    
    // `/reset` is `() => initialState`, and `initialState` now carries the seed.
    
    // It empties the source back to the *start*, which is what the user means by
    
    // "reset" — an empty box would put `/ast` back to answering "no source".
    const result = store.getState().chat.source;
    const expected = INITIAL_SOURCE;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: an unknown command answers with an error', async (t) => {
    const {store, send} = setup();
    
    await send('notacommand');
    
    const [last] = store.getState().chat.messages;
    const result = last.result && last.result.type;
    const expected = 'error';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: an unknown command names itself in the error', async (t) => {
    const {store, send} = setup();
    
    await send('notacommand');
    
    const [last] = store.getState().chat.messages;
    const result = last.result && last.result.type === 'error' && last.result.message;
    const expected = 'Unknown command: notacommand. Try help.';
    
    t.equal(result, expected);
    t.end();
});

/**
 * Reverses the "a line that is not a command is ignored" test.
 *
 * That one asserted `messages.length === 0` for `hello`, so typing a sentence
 * and pressing Send produced **nothing at all** — no echo, no error, and a box
 * that looked broken. With no slash in the grammar a bare word is not "not a
 * command", it is a first word that names no command, so it takes the same
 * path as `notacommand` above. One answer for both rather than a bare-word
 * branch and an unknown-command branch that disagree.
 */
test('useChat: plain text answers with an error rather than vanishing', async (t) => {
    const {store, send} = setup();
    
    await send('hello');
    
    const [last] = store.getState().chat.messages;
    const result = last.result && last.result.type;
    const expected = 'error';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: plain text is echoed as what the user typed', async (t) => {
    const {store, send} = setup();
    
    await send('what does this do?');
    
    const [last] = store.getState().chat.messages;
    const result = last.text;
    const expected = 'what does this do?';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: an empty line answers with the parse error', async (t) => {
    const {store, send} = setup();
    
    await send('   ');
    
    const [last] = store.getState().chat.messages;
    const result = last.result && last.result.type === 'error' && last.result.message;
    const expected = 'Empty command';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: ast with no source answers with an error', async (t) => {
    const {store, send} = setup({
        source: '',
    });
    
    await send('ast');
    
    const [last] = store.getState().chat.messages;
    const result = last.result && last.result.type;
    const expected = 'error';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: find reports where a plugin matches', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;');
    await send('find\nexport const report = () => "x";\nexport const replace = () => ({"const __a = __b": "let __a = __b"});');
    
    const {messages} = store.getState().chat;
    const last = messages.at(-1);
    const result = last.result && last.result.type;
    const expected = 'places';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: a second command in the same input also runs', async (t) => {
    const {store, send} = setup();
    
    await send('source\nconst a = 1;\nast');
    
    const result = store.getState().chat.consoleAst !== null;
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('useChat: a rest after a non-source command threads the existing buffer', async (t) => {
    const {store, send} = setup();
    
    // `parseCommand` only fills `rest` after a multi-line *body*, so the first
    // command has to take one. `/source` is the case whose result feeds the
    // `result.data` arm; this uses `/validate`, whose result is `text`, so the
    // recursion takes the other arm and passes the buffer already in the store
    // through to `/ast` unchanged.
    await send('source\nconst a = 1;');
    await send('validate\nexport const report = () => "x";\nast');
    
    const result = store.getState().chat.consoleAst && store.getState().chat.consoleAst.source;
    const expected = 'const a = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('useChat: a source result with a rest hands the new source to the next command', async (t) => {
    const {store, send} = setup();
    
    // The other arm of the ternary at the end of `send`: a `source` result
    // *with* a `rest` threads the freshly set buffer into the next command. With
    // the closure-only form the recursion would parse the previous source, so
    // the console tree here is of `const b = 2;` and not of what came before.
    await send('source\nconst a = 1;');
    await send('source\nconst b = 2;\nast');
    
    const result = store.getState().chat.consoleAst && store.getState().chat.consoleAst.source;
    const expected = 'const b = 2;';
    
    t.equal(result, expected);
    t.end();
});
