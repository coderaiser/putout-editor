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
import App from './App.tsx';

const wrap = (store: Store<RootState>) => ({children}: {children: ReactNode;}) => (
    <Provider store={store}>
        {children}
    </Provider>
);

const mount = () => {
    const store = makeStore();
    
    render(<App/>, {
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
        ctrlKey: true,
    });
};

const wait = () => setTimeout(20);

const toggle = () => document.querySelector('[data-testid="console-toggle"]');

const panel = () => document.querySelector('[data-testid="console-panel"]');

test('App: the console panel is absent by default', (t) => {
    mount();
    
    const result = panel();
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the app is not in split layout by default', (t) => {
    mount();
    
    const result = document.querySelector('.chat-app--split');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: /console makes the panel appear', async (t) => {
    mount();
    
    send('/console');
    await wait();
    
    const result = panel() !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: /console puts the app into split layout', async (t) => {
    mount();
    
    send('/console');
    await wait();
    
    const result = document.querySelector('.chat-app--split') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: /console with no /ast yet shows the empty panel', async (t) => {
    mount();
    
    send('/console');
    await wait();
    
    const element = panel();
    const result = element && element.textContent;
    const expected = 'Run /ast to populate the tree';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: /console again hides the panel', async (t) => {
    mount();
    
    send('/console');
    await wait();
    send('/console');
    await wait();
    
    const result = panel();
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the panel shows the tree after /ast', async (t) => {
    mount();
    
    send('/source\nconst a = 1;');
    await wait();
    send('/ast');
    await wait();
    send('/console');
    await wait();
    
    const result = document.querySelectorAll('.console-panel [data-testid="ast-row"]').length > 0;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the header names the editor', (t) => {
    mount();
    
    const title = document.querySelector('.chat-header__title');
    const result = title && title.textContent;
    const expected = '🐊 putout chat';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the header offers the console toggle', (t) => {
    mount();
    
    const element = toggle();
    const result = element && element.textContent;
    const expected = 'console ⊞';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the header reads hide console once it is open', async (t) => {
    mount();
    
    send('/console');
    await wait();
    
    const element = toggle();
    const result = element && element.textContent;
    const expected = 'console ⊟';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the chat is always on screen', (t) => {
    mount();
    
    const result = document.querySelector('[data-testid="chat"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The header control dispatches `toggleConsole` itself rather than sending the
 * `/console` command. A click has to be a click — and because both go through
 * the same reducer, the button and the command cannot leave the panel in
 * different states, which is the whole reason the button dispatches directly.
 */
test('App: clicking the header control opens the console panel', (t) => {
    mount();
    
    fireEvent.click(document.querySelector('[data-testid="console-toggle"]') as HTMLElement);
    
    const result = document.querySelector('.chat-console') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: clicking the header control again closes it', (t) => {
    mount();
    
    const button = document.querySelector('[data-testid="console-toggle"]') as HTMLElement;
    
    fireEvent.click(button);
    fireEvent.click(button);
    
    const result = document.querySelector('.chat-console');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the header control carries the active class only while open', (t) => {
    mount();
    
    const button = document.querySelector('[data-testid="console-toggle"]') as HTMLElement;
    const active = () => button.classList.contains('chat-header__btn--active');
    
    const before = active();
    
    fireEvent.click(button);
    
    const after = active();
    
    const result = {
        before,
        after,
    };
    
    const expected = {
        before: false,
        after: true,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});
