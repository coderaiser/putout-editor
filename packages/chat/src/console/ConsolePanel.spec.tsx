import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import type {ReactNode} from 'react';
import type {FlatNode} from '@putout/editor-commands';
import {makeStore} from '#test/store';
import ConsolePanel from './ConsolePanel.tsx';

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

/**
 * The `✕` dispatches `toggleConsole`, so the panel needs a store like any other
 * consumer of one — and it is `makeStore` again, preloaded open, because a spec
 * that built its own would be testing a store the page never runs.
 */
const panel = (nodes: FlatNode[] | null) => {
    const store = makeStore({
        consoleOpen: true,
    });
    
    const wrapper = ({children}: {children: ReactNode;}) => (
        <Provider store={store}>
            {children}
        </Provider>
    );
    
    render(<ConsolePanel
        ast={nodes && {
            nodes,
            source: 'const a = 1;',
        }}
    />, {
        wrapper,
    });
    
    return store;
};

test('ConsolePanel: no ast says so rather than showing a blank box', (t) => {
    panel(null);
    
    const element = document.querySelector('[data-testid="console-empty"]');
    const result = element && element.textContent;
    const expected = 'Run /ast to populate the tree';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ConsolePanel: a populated panel renders the tree', (t) => {
    panel([
        node('0'),
    ]);
    
    const result = document.querySelectorAll('[data-testid="ast-row"]').length;
    const expected = 1;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ConsolePanel: the empty panel draws no tree', (t) => {
    panel(null);
    
    const result = document.querySelectorAll('[data-testid="ast-row"]').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ConsolePanel: the ✕ closes the panel', (t) => {
    const store = panel([
        node('0'),
    ]);
    
    const before = store.getState().chat.consoleOpen;
    
    fireEvent.click(document.querySelector('[data-testid="console-close"]') as HTMLElement);
    
    const after = store.getState().chat.consoleOpen;
    
    const result = {
        before,
        after,
    };
    
    const expected = {
        before: true,
        after: false,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('ConsolePanel: the ✕ is on the empty panel too', (t) => {
    // A panel with nothing in it is the one that looks like a dead end, and it
    // is the one the user most needs a way out of.
    const store = panel(null);
    
    fireEvent.click(document.querySelector('[data-testid="console-close"]') as HTMLElement);
    
    const result = store.getState().chat.consoleOpen;
    const expected = false;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ConsolePanel: the ✕ is present on both panels', (t) => {
    panel(null);
    
    const empty = document.querySelector('[data-testid="console-close"]') !== null;
    
    cleanup();
    
    panel([
        node('0'),
    ]);
    
    const populated = document.querySelector('[data-testid="console-close"]') !== null;
    
    const result = {
        empty,
        populated,
    };
    
    const expected = {
        empty: true,
        populated: true,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('ConsolePanel: the header says what the panel is', (t) => {
    panel(null);
    
    const element = document.querySelector('.console-panel__title');
    const result = element && element.textContent;
    const expected = 'AST';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
