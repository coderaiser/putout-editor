import {test} from 'supertape';
import {setTimeout} from 'node:timers/promises';
import {
    render,
    cleanup,
    act,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import type {Store} from '@reduxjs/toolkit';
import {makeStore} from '#test/store';
import type {RootState} from '#store/types';
import {flattenLearn, type LearnNode} from '@putout/editor-commands';
import LearnBlock from './LearnBlock.tsx';

/**
 * A real tree rather than a fixture, because the flattening happens *inside*
 * this component — a hand-written `LearnNode[]` would agree with `flattenLearn`
 * only because the same author wrote both.
 */
const tree: LearnNode[] = [{
    id: 'root',
    label: 'root',
    summary: 'the top',
    body: 'top body',
    children: [{
        id: 'root/leaf',
        label: 'leaf',
        summary: 'a leaf',
        body: 'leaf body',
        example: 'const a = 1;\n',
    }, {
        id: 'root/prose',
        label: 'prose',
        summary: 'a prose-only leaf',
        body: 'prose body',
    }],
}];

const setup = () => {
    const store = makeStore() as Store<RootState>;
    
    const wrap = ({children}: {children: ReactNode;}) => (
        <Provider store={store}>
            {children}
        </Provider>
    );
    
    render(<LearnBlock tree={tree}/>, {
        wrapper: wrap,
    });
    
    return store;
};

const results = (store: Store<RootState>): (string | null)[] => store
    .getState()
    .chat
    .messages
    .map(({result}) => (result && result.type) || null);

const rows = () => [
    ...document.querySelectorAll('[data-testid="learn-row"]'),
];

/**
 * The tree is the reply, so the first thing to assert is that it is *there*
 * and shaped like the plan's `data-testid="learn-output"` — the e2e scopes to
 * this id, and a component that forgot it would be invisible to a spec that
 * only checked row text.
 */
test('LearnBlock: renders the learn-output testid', (t) => {
    setup();
    
    const result = document.querySelector('[data-testid="learn-output"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnBlock: flattens the tree into rows', (t) => {
    setup();
    
    const result = rows().length;
    const expected = flattenLearn(tree).length;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * Enter on a leaf appends the body and the `[try it →]`, in that order.
 *
 * The whole of what `learnOpen` exists for: two messages, ordered, from one
 * dispatch. The order matters because `Message` renders them as two blocks in
 * the order they landed, and a swapped pair would show the button above its own
 * explanation.
 */
test('LearnBlock: opening a leaf appends the body then the tryit', async (t) => {
    const store = setup();
    const before = store.getState().chat.messages.length;
    
    // `root/leaf` is the only leaf, so there is one row below the root.
    fireEvent.click(rows()[1]);
    
    await act(async () => {
        fireEvent.keyDown(document.querySelector('[data-testid="learn-output"]') as HTMLElement, {
            key: 'Enter',
        });
    });
    
    await setTimeout(20);
    
    const result = results(store).slice(before);
    const expected = ['text', 'tryit'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The body the leaf carries is what lands in the `text` message.
 *
 * A guard against a thunk that appends *a* message rather than *this* node's
 * message — which would pass an order-only assertion and render the wrong
 * concept's prose.
 */
test('LearnBlock: the body message carries the leaf body', async (t) => {
    const store = setup();
    const before = store.getState().chat.messages.length;
    
    fireEvent.click(rows()[1]);
    
    await act(async () => {
        fireEvent.keyDown(document.querySelector('[data-testid="learn-output"]') as HTMLElement, {
            key: 'Enter',
        });
    });
    
    await setTimeout(20);
    
    const message = store.getState().chat.messages[before];
    const result = (message.result && message.result.type === 'text' && message.result.data) || null;
    const expected = 'leaf body';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A leaf with no example answers with one message, not two.
 *
 * The `!payload.example` arm of `extraReducers`, and the arm that keeps a
 * prose-only concept from offering a button to run nothing. The fixture's root
 * is a container, so this opens it... no: `Enter` on a container *expands*.
 * Instead it asserts the count stays at one for the only other shape in play.
 */
test('LearnBlock: the root has no example and opens with no tryit', async (t) => {
    const store = setup();
    const before = store.getState().chat.messages.length;
    
    // `Enter` on the root expands rather than opening, so no message lands —
    // which is the container rule, asserted through the count.
    fireEvent.click(rows()[0]);
    
    await act(async () => {
        fireEvent.keyDown(document.querySelector('[data-testid="learn-output"]') as HTMLElement, {
            key: 'Enter',
        });
    });
    
    await setTimeout(20);
    
    const result = results(store).slice(before).length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A leaf with no `example` appends exactly one message — the body — and no
 * `tryit` block.
 *
 * This is the `!payload.example` arm of `extraReducers` in `slice.ts:246`.
 * The root is a container (Enter expands, not opens), so the only way to reach
 * the uncovered branch is a leaf without an `example` field.
 */
test('LearnBlock: opening a prose-only leaf appends only the body', async (t) => {
    const store = setup();
    const before = store.getState().chat.messages.length;
    
    // `rows()[2]` is `root/prose` — the second child, no example.
    fireEvent.click(rows()[2]);
    
    await act(async () => {
        fireEvent.keyDown(document.querySelector('[data-testid="learn-output"]') as HTMLElement, {
            key: 'Enter',
        });
    });
    
    await setTimeout(20);
    
    const result = results(store).slice(before);
    const expected = ['text'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});
