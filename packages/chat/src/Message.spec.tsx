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

const renderWithStore = (message: MessageModel) => render(<Message message={message}/>, {
    wrapper: wrap(makeStore() as Store<RootState>),
});

/**
 * A message with no `result` renders nothing. The app does not make one
 * today, so only a direct render reaches this branch.
 */
test('Message: a message with no result yet renders nothing', (t) => {
    const message: MessageModel = {
        id: 1,
        text: 'ast',
        result: null,
    };
    
    render(
        <Message message={message}/>,
    );
    
    const node = document.querySelector('.message');
    const result = node && node.textContent;
    const expected = '';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A `text` result that is not `help` is a `TextBlock`. A non-`text`
 * result (`source`) is not the table either.
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
    
    render(
        <Message message={message}/>,
    );
    
    const block = document.querySelector('.text-block');
    const result = block && block.textContent;
    const expected = 'Console opened';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `learn` and `tryit` come before the `TextBlock` and `SourceBlock`
 * fallbacks. The order is the contract.
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
    
    const element = document.querySelector('[data-testid="try-it"]');
    const result = element && element.textContent;
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
                succs: [{
                    id: 'exit',
                }],
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
