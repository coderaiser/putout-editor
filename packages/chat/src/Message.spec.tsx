import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import type {Store} from '@reduxjs/toolkit';
import {makeStore} from '#test/store';
import type {RootState} from '#store/types';
import type {Message as MessageModel} from '#store';
import Message from './Message.tsx';

/**
 * `Message` renders `LearnBlock` and `TryItBlock`, both of which reach the
 * store — one through `useDispatch`, the other through `useChat`. Every other
 * arm is a pure component, which is why the rest of this file renders bare; the
 * two new arms need the `Provider` the page has.
 */
const wrap = (store: Store) => ({children}: {children: ReactNode;}) => (
    <Provider store={store}>
        {children}
    </Provider>
);

const renderWithStore = (message: MessageModel) => render(
    <Message message={message}/>,
    {wrapper: wrap(makeStore() as Store<RootState>)},
);

/**
 * A line still running: no `result` yet, so `Message` renders nothing.
 *
 * `Result`'s first branch is `if (!result) return null`. Nothing in the app
 * produces a null-result message today — `useChat` always dispatches the
 * command's answer with the message — so this branch is only reachable by
 * handing `Message` a message directly. That is still worth having: the
 * branch is in the render path, and a spec is cheaper than discovering it
 * uncovered.
 */
test('Message: a message with no result yet renders nothing', (t) => {
    const message: MessageModel = {
        id: 1,
        text: 'ast',
        result: null,
    };
    
    render(<Message message={message}/>);
    
    const node = document.querySelector('.message');
    const result = node && node.textContent;
    const expected = '';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A `text` result that is **not** `help` is a `TextBlock`, not the table.
 *
 * The other half of the `text === 'help' && result.type === 'text'` guard: the
 * first operand short-circuits for every ordinary `text` answer, and without
 * this a help-specific branch could quietly swallow all of them. `source` is
 * the natural subject — it answers with `type: 'source'`, so this pins that the
 * table does not swallow a non-`text` result either.
 */
test('Message: a text result that is not help is not the table', (t) => {
    const message: MessageModel = {
        id: 2,
        text: 'console',
        result: {
            type: 'text',
            data: 'Console opened',
        },
    };
    
    render(<Message message={message}/>);
    
    const block = document.querySelector('.text-block');
    const result = block && block.textContent;
    const expected = 'Console opened';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The two new arms.
 *
 * `learn` and `tryit` sit before the fall-through to `TextBlock` and
 * `SourceBlock` — the order is the whole contract. A `learn` result that
 * reached `TextBlock` would render a whole curriculum as a paragraph, and a
 * `tryit` that reached `SourceBlock` would lose the button that is its only
 * reason to exist.
 */
test('Message: a learn result renders the tree', (t) => {
    const message: MessageModel = {
        id: 3,
        text: '/learn',
        result: {
            type: 'learn',
            tree: [{
                id: 'putout',
                label: 'putout',
                summary: 'the tool',
                body: 'body',
                children: [],
            }],
        },
    };
    
    renderWithStore(message);
    
    const result = document.querySelector('[data-testid="learn-output"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A `tryit` result must keep its button, which is the only reason the block
 * exists. It falls through to `SourceBlock` otherwise, and a source echo with
 * no `[try it →]` is a dead end: the whole flow the block is for — open a
 * concept, try its code — becomes two separate things.
 */
test('Message: a tryit result renders the try it button', (t) => {
    const message: MessageModel = {
        id: 4,
        text: '/learn ast/nodes/Identifier',
        result: {
            type: 'tryit',
            source: 'const a = 1;\n',
        },
    };
    
    renderWithStore(message);
    
    const result = document.querySelector('[data-testid="try-it"]')?.textContent;
    const expected = 'try it →';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/** A `flow` result renders FlowBlock with source and graph panels. */
test('Message: flow result renders FlowBlock', (t) => {
    const message: MessageModel = {
        id: 5,
        text: '/flow',
        result: {
            type: 'flow',
            text: 'block 0\n  return a;\n  -> exit',
            blocks: [{
                id: 0,
                stmts: ['return a;'],
                succs: [{id: 'exit'}],
                terminal: true,
            }],
            source: 'function f() { return a; }',
        },
    };

    renderWithStore(message);

    const result = document.querySelector('[data-testid="flow-output"]') !== null;

    cleanup();

    t.equal(result, true);
    t.end();
});

