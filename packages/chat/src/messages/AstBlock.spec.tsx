import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {
    commands,
    parseCommand,
    type CommandResult,
    type FlatNode,
} from '@putout/editor-commands';
import AstBlock from './AstBlock.tsx';

const SOURCE = 'const add = (a, b) => a + b;';

interface Pointer {
    coarse: boolean;
}

const noop = () => {};

/**
 * A `(pointer: coarse)` stub, wrapping the render.
 *
 * `matches` is a **getter**, not a snapshot: `useIsMobile` calls `matchMedia`
 * once and re-reads `query.matches` inside its `change` listener, so a plain
 * property would freeze at the value it had when the tree mounted.
 *
 * Restored after `fn` rather than for the file, because the component reads the
 * query at mount — a stub left behind would quietly change every spec that runs
 * after it.
 */
const withPointer = (coarse: boolean, fn: () => void) => {
    const original = globalThis.matchMedia;
    
    const pointer: Pointer = {
        coarse,
    };
    
    globalThis.matchMedia = ((query: string) => ({
        get matches() {
            return query === '(pointer: coarse)' && pointer.coarse;
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
 * The rows built the way the app builds them — through the `/ast` command —
 * rather than by hand. A hand-written `FlatNode[]` is a fixture that agrees with
 * the component only because the same author wrote both; this one goes through
 * the parser, so a change to `flattenAst` breaks this spec instead of passing it.
 */
const rows = (): FlatNode[] => {
    const parsed = parseCommand('/ast');
    
    if (!('command' in parsed))
        return [];
    
    const command = commands.get('ast');
    
    if (!command)
        return [];
    
    const result = command.run('', {
        source: SOURCE,
        plugin: '',
    }) as CommandResult;
    
    return result.type === 'ast' ? result.nodes : [];
};

const block = (nodes: FlatNode[]) => render(
    <AstBlock
        nodes={nodes}
        source={SOURCE}
    />,
);

/**
 * `Array.from` and a plain call, not `[...nodeList].map(({getAttribute}) => …)`:
 * pulling the method off the element detaches it from its receiver, and
 * happy-dom's `getAttribute` reads `Symbol(attributes)` off `this`. The
 * commands package's own `AstTree.spec` uses `row.getAttribute(...)` inside a
 * `for` loop for the same reason.
 */
const types = (): (string | null)[] => {
    const result: (string | null)[] = [];
    const rows = document.querySelectorAll('[data-testid="ast-row"]');
    
    for (const row of rows)
        result.push(row.getAttribute('data-type'));
    
    return result;
};

test('AstBlock: renders the ast-output testid', (t) => {
    block([]);
    
    const result = document.querySelector('[data-testid="ast-output"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstBlock: renders rows, so the commands tree is what is on screen', (t) => {
    block(rows());
    
    const result = types().length > 0;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstBlock: shows the Program node the source parsed to', (t) => {
    block(rows());
    
    const result = types().includes('Program');
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstBlock: the tree folds below depth 2, so a deep node is there but not drawn', (t) => {
    const nodes = rows();
    const hasArrow = nodes.some(({type}) => type === 'ArrowFunctionExpression');
    
    block(nodes);
    
    // The row is not on screen because the default collapse hides it, not
    
    // because the parse missed it. Asserting the drawn rows instead would pass
    
    // for a parser that dropped the node, which is the bug this guards.
    const result = {
        parsed: hasArrow,
        drawn: types().includes('ArrowFunctionExpression'),
    };
    
    const expected = {
        parsed: true,
        drawn: false,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstBlock: clicking a fold changes how many rows are drawn', (t) => {
    block(rows());
    
    const count = () => document.querySelectorAll('[data-testid="ast-row"]').length;
    
    const before = count();
    
    // The root starts expanded, so clicking it folds it *away* and the count
    // drops. The point is that the click does something at all: neither
    // direction is asserted, because which way it goes is `AstTree`'s business
    // and this package's business is that the rows follow.
    const first = document.querySelector('[data-testid="ast-row"]') as HTMLElement;
    
    fireEvent.click(first);
    
    const result = count() !== before;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstBlock: an empty tree says so rather than showing a blank box', (t) => {
    block([]);
    
    const element = document.querySelector('.ast__empty');
    const result = element && element.textContent;
    const expected = 'No AST. Run ast first.';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The hint the block renders for each pointer type.
 *
 * The whole path is under test — `useIsMobile` in `AstBlock`, the `mobile` prop
 * through `AstTree`, and `AstStatus` — because each hop is a place a rename
 * could quietly stop passing it. Read off the DOM rather than mocked, so a
 * broken thread shows up as the desktop hint on a coarse pointer.
 */
const hint = (): string | null => {
    const element = document.querySelector('.ast-status__help');
    
    return element && element.textContent;
};

test('AstBlock: shows the short hint on a coarse pointer', (t) => {
    withPointer(true, () => {
        block(rows());
        
        const result = hint();
        const expected = '↑↓ · space · /';
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
});

test('AstBlock: shows the full hint on a fine pointer', (t) => {
    withPointer(false, () => {
        block(rows());
        
        const result = hint();
        const expected = '↑↓/jk navigate · h/l fold/expand · space/enter expand · / search · tab switch';
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
});

/**
 * The code preview is hidden by **CSS**, not by an `if`.
 *
 * That is the design (`AstTree.css`'s `@media (pointer: coarse)`), and this
 * asserts the consequence so the choice is recorded: the element is still in the
 * DOM on a coarse pointer, because hiding it in JS would mean `AstTree` has to
 * know about pointers to render a tree. The e2e is what checks it is not
 * *visible*; jsdom has no layout, so it can only check that it is still there.
 */
test('AstBlock: keeps the code preview mounted on a coarse pointer', (t) => {
    withPointer(true, () => {
        block(rows());
        
        const result = document.querySelector('.ast-code-preview') !== null;
        const expected = true;
        
        cleanup();
        
        t.equal(result, expected);
        t.end();
    });
});
