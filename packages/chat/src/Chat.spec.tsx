import {setTimeout} from 'node:timers/promises';
import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import type {Store} from '@reduxjs/toolkit';
import {makeStore} from '#test/store';
import {
    addMessage,
    initialState,
    nextId,
} from '#store';
import type {RootState} from '#store/types';
import Chat from './Chat.tsx';

const wrap = (store: Store<RootState>) => ({children}: {children: ReactNode;}) => (
    <Provider store={store}>
        {children}
    </Provider>
);

const mount = () => {
    const store = makeStore();
    
    render(<Chat/>, {
        wrapper: wrap(store),
    });
    
    return store;
};

const box = () => document.querySelector('[data-testid="input"]') as HTMLTextAreaElement;

/**
 * `Ctrl+Enter`, because plain `Enter` is a newline now. These tests are about
 * what lands in the thread, not about the key that sends it, so the chord lives
 * here once.
 */
const send = (text: string) => {
    fireEvent.change(box(), {
        target: {
            value: text,
        },
    });
    
    fireEvent.keyDown(box(), {
        key: 'Enter',
        ctrlKey: true,
    });
};

const wait = () => setTimeout(10);

test('Chat: source puts the source message in the thread', async (t) => {
    mount();
    
    send('/source\nconst a = 1;');
    await wait();
    
    const result = document.querySelector('[data-testid="source-block"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Chat: source updates the store', async (t) => {
    const store = mount();
    
    send('/source\nconst a = 1;');
    await wait();
    
    const result = store.getState().chat.source;
    const expected = 'const a = 1;';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Chat: ast renders the tree with the ast-output testid', async (t) => {
    mount();
    
    send('/source\nconst a = 1;');
    await wait();
    send('/ast');
    await wait();
    
    const result = document.querySelector('[data-testid="ast-output"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Chat: the tree shows the Program the source parsed to', async (t) => {
    mount();
    
    send('/source\nconst a = 1;');
    await wait();
    send('/ast');
    await wait();
    
    const rows = document.querySelectorAll('[data-testid="ast-row"]');
    const result = rows[0].getAttribute('data-type');
    const expected = 'Program';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Chat: an unknown command renders the error block', async (t) => {
    mount();
    
    send('/notacommand');
    await wait();
    
    const result = document.querySelector('.error-block') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The **last** user pill, not the first.
 *
 * The thread opens seeded, so `querySelector` finds the `source` example's own
 * pill and every assertion here would be about the seed. `.at(-1)` is the line
 * the user just sent, which is what the test is named for.
 */
test('Chat: the sent line is echoed as the user message', async (t) => {
    mount();
    
    send('/help');
    await wait();
    
    const pills = [...document.querySelectorAll('.message--user')];
    const user = pills.at(-1);
    const result = user && user.textContent;
    const expected = '/help';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * Reverses "an empty thread renders no messages".
 *
 * That one asserted zero `[data-testid="message"]` elements on mount and so
 * pinned the blank opening screen. What the page must actually do is render the
 * seed: a worked `source` example and the help. The count is relative to the
 * seed, and the two command words below are what makes it about *those*
 * messages rather than about a number.
 */
test('Chat: the thread renders the seeded messages', (t) => {
    mount();
    
    const rendered = document.querySelectorAll('[data-testid="message"]').length;
    const commands = [];
    
    for (const {textContent} of document.querySelectorAll('.message--user'))
        commands.push((textContent || '').split('\n')[0]);
    
    const result = {
        count: rendered === initialState.messages.length,
        commands: commands.slice(0, 2),
    };
    
    // Seeded with the sigil, since these are the lines the page opens with and
    // the ones it now accepts.
    const expected = {
        count: true,
        commands: ['/source', '/help'],
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('Chat: the chat carries the chat testid', (t) => {
    mount();
    
    const result = document.querySelector('[data-testid="chat"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The `help` answer is the **table**, not a paragraph.
 *
 * `HelpBlock` shipped with three specs and no call site — `help` answered with
 * `text` and `Message` rendered every `text` as a `TextBlock`, so the table was
 * fully covered and completely invisible. A component at 100% that no user can
 * reach is the exact failure this repo's own guidance warns about, so this is
 * the spec that would have caught it: it renders the real `App` path rather
 * than the component in isolation.
 */
test('Chat: help renders the table, not plain text', async (t) => {
    mount();
    
    send('/help');
    await wait();
    
    const result = document.querySelector('[data-testid="help-block"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * …and the table's rows are the registry's, carrying each command's usage.
 *
 * The other half of the previous test: a table with no rows would pass it, and
 * a table of names with no usage would pass this one only if the expectation
 * were written as a count. It is read off the first row and compared to the
 * registry, so a `source` that lost its `[source]` fails.
 */
test('Chat: the help table shows each command with its usage', async (t) => {
    mount();
    
    send('/help');
    await wait();
    
    const first = document.querySelector('.help-block__name');
    const result = first && first.textContent;
    const expected = '/source [source]';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `find`'s answer renders the places list.
 *
 * The `Message` branch for a `places` result is reached **only** through a
 * render — `useChat`'s own specs assert on the store and never mount a
 * component, so nothing else covers it. It was covered before the thread was
 * seeded only by accident of ordering: `find`'s answer used to be the first
 * message in an otherwise empty thread. With the seed there is no ordering that
 * reaches it by luck, so this says which result maps to which block on purpose.
 */
test('Chat: find renders the places list', async (t) => {
    mount();
    
    send('/find\nexport const report = () => "x";\nexport const replace = () => ({"const __a = __b": "let __a = __b"});');
    await wait();
    
    const result = document.querySelector('[data-testid="places-list"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `transform`'s answer renders the before/after diff — the other half of the
 * same coverage hole, and the one with the most lines behind it.
 *
 * `TransformDiff` has its own spec, so this is not about the diff's markup. It
 * is that `Message` must route a `transform` result to it at all.
 */
test('Chat: transform renders the before and after diff', async (t) => {
    const store = mount();
    
    store.dispatch(addMessage({
        id: nextId(),
        text: 'transform',
        result: {
            type: 'transform',
            before: 'const a = 1;',
            after: 'let a = 1;',
        },
    }));
    await wait();
    
    const result = document.querySelector('.transform-diff') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
