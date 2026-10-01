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
    const expected = 'No AST. Run /ast first.';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
