import {setTimeout} from 'node:timers/promises';
import {test} from 'supertape';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import type {Store} from '@reduxjs/toolkit';
import {
    render,
    cleanup,
    act,
    fireEvent,
} from '@testing-library/react';
import {makeStore} from '#test/store';
import type {RootState} from '#store/types';
import TryItBlock from './TryItBlock.tsx';

const EXAMPLE = 'const a = 1;';

const setup = () => {
    const store = makeStore() as Store<RootState>;
    
    const wrap = ({children}: {children: ReactNode;}) => (
        <Provider store={store}>
            {children}
        </Provider>
    );
    
    render(<TryItBlock source={EXAMPLE}/>, {
        wrapper: wrap,
    });
    
    return store;
};

const results = (store: Store<RootState>): (string | null)[] => store
    .getState()
    .chat
    .messages
    .map(({result}) => result && result.type || null);

/**
 * A real store behind a real `send`, not a mock `dispatch`.
 *
 * The button runs two commands — `source` then `ast` — and a stub that recorded
 * "called twice with the right args" would assert nothing about the part that
 * can break: whether the store's source becomes the example and whether the
 * thread answers with a tree. This asserts both, through the same path a click
 * in the page takes.
 */
test('TryItBlock: renders the source code', (t) => {
    setup();
    
    const result = document.querySelector('[data-testid="tryit-block"]') && document.querySelector('[data-testid="tryit-block"]').textContent && document
        .querySelector('[data-testid="tryit-block"]')
        .textContent
        .includes(EXAMPLE);
    
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TryItBlock: renders a try it button', (t) => {
    setup();
    
    const result = document.querySelector('[data-testid="try-it"]') && document.querySelector('[data-testid="try-it"]').textContent;
    const expected = 'try it →';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TryItBlock: clicking the button puts the example in the source', async (t) => {
    const store = setup();
    
    await act(() => {
        fireEvent.click(document.querySelector('[data-testid="try-it"]') as HTMLElement);
    });
    
    await setTimeout(20);
    
    const result = store.getState().chat.source;
    const expected = EXAMPLE;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TryItBlock: clicking the button answers with source then ast', async (t) => {
    const store = setup();
    const before = store.getState().chat.messages.length;
    
    await act(() => {
        fireEvent.click(document.querySelector('[data-testid="try-it"]') as HTMLElement);
    });
    
    await setTimeout(20);
    
    const result = results(store).slice(before);
    const expected = [
        'source',
        'ast',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});
