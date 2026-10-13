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

const node = (id: string, over: Partial<FlatNode> = {}): FlatNode => ({
    id,
    pid: null,
    depth: 0,
    type: 'Program',
    detail: '',
    line: 1,
    col: 0,
    endLine: 1,
    endCol: 10,
    ...over,
});

const noop = () => {};

/**
 * A `(pointer: coarse)` stub, wrapping the render.
 *
 * `matches` is a **getter**, not a snapshot: `useIsMobile` calls `matchMedia`
 * once and re-reads `query.matches` inside its `change` listener, so a plain
 * property would freeze at the value it had when the panel mounted. Restored
 * after `fn` rather than for the file, because the component reads the query at
 * mount — a stub left behind would quietly change every spec after it.
 *
 * The same helper `AstBlock.spec.tsx` and `useIsMobile.spec.tsx` each carry, and
 * the reason it is repeated rather than shared: a stub that installs a global
 * for the length of a `fn` is the one thing a spec file should own outright.
 */
const withPointer = (coarse: boolean, fn: () => void) => {
    const original = globalThis.matchMedia;
    
    globalThis.matchMedia = ((query: string) => ({
        get matches() {
            return query === '(pointer: coarse)' && coarse;
        },
        media: query,
        onchange: null,
        addEventListener: noop,
        removeEventListener: noop,
        addListener: noop,
        removeListener: noop,
        dispatchEvent: () => true,
    })) as unknown as typeof globalThis.matchMedia;
    
    fn();
    
    globalThis.matchMedia = original;
};

/**
 * A three-level tree: a `Program` with one child that has a child of its own.
 *
 * The `useTreeState` default folds everything below depth 1, which hides
 * `VariableDeclarator` — but a collapsed row is still **drawn**, so this shows
 * three rows and the depth-1 row is the one whose fold is visible: toggling it
 * hides its child and the count drops to two. The root would drop it to one
 * (`AstBlock.spec.tsx` clicks the root for exactly that), and a depth-1 row is
 * the better subject here because it leaves the panel with a tree rather than
 * with a stump.
 *
 * Built by hand rather than through `runAst`, because the spec is about the
 * panel's pointer handling and a parse would couple it to `flattenAst`'s output
 * — the same reasoning `AstBlock.spec.tsx` makes in the other direction for the
 * rows it *does* take from the command.
 */
const twoLevel = (): FlatNode[] => [
    node('0'),
    node('1', {
        pid: '0',
        depth: 1,
        type: 'VariableDeclaration',
    }),
    node('2', {
        pid: '1',
        depth: 2,
        type: 'VariableDeclarator',
    }),
];

/** The row a tap targets: depth 1, with a child, so its fold changes the count. */
const FOLDABLE = 1;

const panelRows = () => document
    .querySelectorAll('.console-panel [data-testid="ast-row"]')
    .length;

const panelHelp = (): string | null => {
    const element = document.querySelector('.console-panel .ast-status__help');
    
    return element && element.textContent;
};


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
    const expected = 'Run ast to populate the tree';
    
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

/**
 * The whole of bug 1, asserted on the panel's own DOM.
 *
 * `ConsolePanel` mounted `AstTree` without `mobile`, so on a phone its rows
 * behaved like desktop ones: a tap both selected and folded, and because a
 * coarse pointer fires `click` on `pointerup` the user tapped twice and watched
 * the fold cancel itself. The thread's copy of the same tree was right — it
 * goes through `AstBlock`, which reads `useIsMobile` — so the bug was only ever
 * visible in the panel, which is exactly what makes it worth a spec of its own
 * rather than a note on `AstTree`'s.
 *
 * Two rows before and after, because a coarse tap selects and does **not**
 * fold: `AstRow` binds the fold to `!mobile && hasChildren`, and this is that
 * branch reached through the panel's own `mobile` prop rather than through
 * `AstBlock`'s.
 */
test('ConsolePanel: a coarse tap selects the row and leaves it unfolded', (t) => {
    withPointer(true, () => {
        panel(twoLevel());
        
        const before = panelRows();
        
        fireEvent.click(document.querySelectorAll('.console-panel [data-testid="ast-row"]')[FOLDABLE] as Element);
        
        const result = {
            before,
            after: panelRows(),
        };
        const expected = {
            before: 3,
            after: 3,
        };
        
        cleanup();
        
        t.deepEqual(result, expected);
        t.end();
    });
});

/**
 * The fine pointer still folds, which is the half that stops the spec above
 * from passing on a panel whose rows never fold at all.
 *
 * A regression that dropped `onToggle` from the panel would keep the coarse
 * case green and break every desktop user of the panel, so both arms are
 * pinned — the same pairing `AstRow.spec.tsx` makes for the row itself.
 */
test('ConsolePanel: a fine click folds the row', (t) => {
    withPointer(false, () => {
        panel(twoLevel());
        
        fireEvent.click(document.querySelectorAll('.console-panel [data-testid="ast-row"]')[FOLDABLE] as Element);
        
        const result = panelRows();
        const expected = 2;
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
});

/**
 * The status bar's hint, which is the other thing `mobile` decides.
 *
 * The full hint is 62 characters and teaches `jk`, `h/l` and `tab switch` —
 * keys a touchscreen does not have — so the panel showing it on a phone was the
 * second half of bug 1 and the half a row-count assertion cannot see.
 */
test('ConsolePanel: the hint shortens on a coarse pointer', (t) => {
    withPointer(true, () => {
        panel(twoLevel());
        
        const result = panelHelp();
        const expected = '↑↓ · space · /';
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
});

test('ConsolePanel: the hint stays full on a fine pointer', (t) => {
    withPointer(false, () => {
        panel(twoLevel());
        
        const result = panelHelp();
        const expected = '↑↓/jk navigate · h/l fold/expand · space/enter expand · / search · tab switch';
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
});
