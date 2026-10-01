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

const send = (text: string) => {
    fireEvent.change(box(), {
        target: {
            value: text,
        },
    });
    
    fireEvent.keyDown(box(), {
        key: 'Enter',
    });
};

const wait = () => setTimeout(10);

test('Chat: /source puts the source message in the thread', async (t) => {
    mount();
    
    send('/source\nconst a = 1;');
    await wait();
    
    const result = document.querySelector('[data-testid="source-block"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Chat: /source updates the store', async (t) => {
    const store = mount();
    
    send('/source\nconst a = 1;');
    await wait();
    
    const result = store.getState().chat.source;
    const expected = 'const a = 1;';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Chat: /ast renders the tree with the ast-output testid', async (t) => {
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

test('Chat: the sent line is echoed as the user message', async (t) => {
    mount();
    
    send('/help');
    await wait();
    
    const user = document.querySelector('.message--user');
    const result = user && user.textContent;
    const expected = '/help';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Chat: an empty thread renders no messages', (t) => {
    mount();
    
    const result = document.querySelectorAll('[data-testid="message"]').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
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
