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

const wait = () => setTimeout(20);

/**
 * `Ctrl+Enter`, because plain `Enter` is a newline now. Every test below types
 * one whole line and expects it sent, so the chord is the thing being modelled
 * here rather than repeated in each.
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

test('App: console makes the panel appear', async (t) => {
    mount();
    
    send('console');
    await wait();
    
    const result = panel() !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: console puts the app into split layout', async (t) => {
    mount();
    
    send('console');
    await wait();
    
    const result = document.querySelector('.chat-app--split') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: console with no ast yet shows the empty panel', async (t) => {
    mount();
    
    send('console');
    await wait();
    
    // The panel's own header carries the `✕` and the title, so the panel's
    
    // `textContent` is no longer only the hint — the hint is its own element.
    const element = document.querySelector('[data-testid="console-empty"]');
    const result = element && element.textContent;
    const expected = 'Run /ast to populate the tree';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: console again hides the panel', async (t) => {
    mount();
    
    send('console');
    await wait();
    send('console');
    await wait();
    
    const result = panel();
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `/ast` *feeds* the panel even though it no longer opens it, so a `/ast` before
 * a `/console` still shows the tree. That is the behaviour `0e987ac` was for,
 * and it survives the reversal: `setConsoleAst` is untouched.
 */
test('App: the panel shows the tree after ast', async (t) => {
    mount();
    
    send('console');
    await wait();
    send('source\nconst a = 1;');
    await wait();
    send('ast');
    await wait();
    
    const result = document.querySelectorAll('.console-panel [data-testid="ast-row"]').length > 0;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: /ast leaves the panel closed', async (t) => {
    mount();
    
    send('source\nconst a = 1;');
    await wait();
    
    send('ast');
    await wait();
    
    // The tree is in the thread — `Message` renders `AstBlock` for an `ast`
    
    // result — so `/ast` opening the panel as well would be a second copy
    
    // taking half the thread.
    const result = panel();
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: console still opens the panel', async (t) => {
    mount();
    
    send('ast');
    await wait();
    
    send('console');
    await wait();
    
    const result = panel() !== null;
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

test('App: the chat is always on screen', (t) => {
    mount();
    
    const result = document.querySelector('[data-testid="chat"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The `✕` is the only way to dismiss the panel without typing a command, which
 * is what the header button used to be for. It dispatches `toggleConsole`, the
 * same action `/console` does, so the two cannot leave the panel in different
 * states.
 */
test('App: the panel ✕ closes the console', async (t) => {
    mount();
    
    send('console');
    await wait();
    
    fireEvent.click(document.querySelector('[data-testid="console-close"]') as HTMLElement);
    
    const result = document.querySelector('.chat-console');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the panel ✕ comes back after /console', async (t) => {
    mount();
    
    // The `✕` is gone with the panel, so a spec that only ever closed it would
    
    // pass for a panel that could never be reopened. Three `/console`s: open,
    
    // closed, open again.
    send('console');
    await wait();
    fireEvent.click(document.querySelector('[data-testid="console-close"]') as HTMLElement);
    send('console');
    await wait();
    
    const result = document.querySelector('[data-testid="console-close"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('App: the header has no console button', (t) => {
    mount();
    
    const result = document.querySelector('[data-testid="console-toggle"]');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
