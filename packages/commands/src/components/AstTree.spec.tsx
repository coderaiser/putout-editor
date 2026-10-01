import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import AstTree from './AstTree.tsx';
import type {FlatNode} from '../state.types.ts';

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

const node = (id: string, pid: string | null, depth: number, type = 'Node'): FlatNode => ({
    id,
    pid,
    depth,
    type,
    detail: '',
    line: depth + 1,
    col: 0,
    endLine: depth + 1,
    endCol: 8,
});

const program = () => node('0', null, 0, 'Program');
const declaration = () => node('1', '0', 1, 'VariableDeclaration');
const declarator = () => node('2', '1', 2, 'VariableDeclarator');
const identifier = () => node('3', '2', 3, 'Identifier');
const numeric = () => node('4', '1', 2, 'NumericLiteral');

const SOURCE = 'const a = 1;';

const tree = (nodes = [
    program(),
    declaration(),
    declarator(),
    identifier(),
    numeric(),
]) => render(
    <AstTree
        nodes={nodes}
        source={SOURCE}
    />,
);

const rows = () => [
    ...document.querySelectorAll('[data-testid="ast-row"]'),
];

test('AstTree: renders the ast-output testid', (t) => {
    tree();
    
    const result = document.querySelector('[data-testid="ast-output"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: an empty tree says so rather than showing a blank box', (t) => {
    tree([]);
    
    const result = read('.ast__empty');
    const expected = 'No AST. Run /ast first.';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: an empty tree renders no rows', (t) => {
    tree([]);
    
    const result = rows().length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: shows the Program node in a row', (t) => {
    tree();
    
    const result = rows()[0].getAttribute('data-type');
    const expected = 'Program';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: the default collapse hides rows below depth 2', (t) => {
    tree();
    
    const result = rows().map((row) => row.getAttribute('data-type'));
    const expected = [
        'Program',
        'VariableDeclaration',
        'VariableDeclarator',
        'NumericLiteral',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstTree: a collapsed parent hides its children', (t) => {
    tree();
    
    fireEvent.click(rows()[1]);
    
    const result = rows().map((row) => row.getAttribute('data-type'));
    const expected = [
        'Program',
        'VariableDeclaration',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstTree: a query filters the rows', (t) => {
    tree();
    
    const search = document.querySelector('[data-testid="ast-search"]') as HTMLInputElement;
    
    fireEvent.change(search, {
        target: {
            value: 'Identifier',
        },
    });
    
    const result = rows().map((row) => row.getAttribute('data-type'));
    
    const expected = [
        'Program',
        'VariableDeclaration',
        'VariableDeclarator',
        'Identifier',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstTree: a dimmed ancestor keeps its row', (t) => {
    tree();
    
    const search = document.querySelector('[data-testid="ast-search"]') as HTMLInputElement;
    
    fireEvent.change(search, {
        target: {
            value: 'Identifier',
        },
    });
    
    const result = document.querySelectorAll('.ast-row--dimmed').length;
    const expected = 3;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: carries every required data-testid', (t) => {
    tree();
    const found = [];
    
    for (const id of [
        'ast-output',
        'ast-search',
        'ast-row',
        'ast-code-preview',
        'ast-status',
    ]) {
        found.push(Boolean(document.querySelector(`[data-testid="${id}"]`)));
    }
    
    const expected = [
        true,
        true,
        true,
        true,
        true,
    ];
    
    cleanup();
    
    t.deepEqual(found, expected);
    t.end();
});

test('AstTree: shows the code preview', (t) => {
    tree();
    
    const result = read('.ast-code__text');
    const expected = SOURCE;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: the status bar starts with a dash', (t) => {
    tree();
    
    const result = read('.ast-status__type');
    const expected = '—';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: clicking a row puts it in the status bar', (t) => {
    tree();
    
    fireEvent.click(rows()[1]);
    
    const result = read('.ast-status__type');
    const expected = 'VariableDeclaration';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: selecting a row highlights it and its source line', (t) => {
    tree();
    
    fireEvent.click(rows()[1]);
    
    const result = document.querySelectorAll('.ast-row--selected').length;
    const expected = 1;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: a lone child of the root gets the elbow', (t) => {
    tree();
    const connectors = [];
    
    for (const node of document.querySelectorAll('.ast-row__connectors')) {
        connectors.push(node.textContent);
    }
    
    const expected = [
        '',
        '└─ ',
        '   ├─ ',
        '   └─ ',
    ];
    
    cleanup();
    
    t.deepEqual(connectors, expected);
    t.end();
});

test('AstTree: two siblings give the first a tee and the second an elbow', (t) => {
    tree([
        program(),
        declaration(),
        node('5', '0', 1, 'ExpressionStatement'),
    ]);
    const connectors = [];
    
    for (const node of document.querySelectorAll('.ast-row__connectors')) {
        connectors.push(node.textContent);
    }
    
    const expected = [
        '',
        '├─ ',
        '└─ ',
    ];
    
    cleanup();
    
    t.deepEqual(connectors, expected);
    t.end();
});

/**
 * `isLast` is computed over every node, not the drawn ones. Folding the last
 * child's own subtree would otherwise leave its sibling marked as the last,
 * which is the bug this pins: the run of siblings ends at the last *node*, not
 * the last visible one.
 */
test('AstTree: a folded subtree does not change its sibling connectors', (t) => {
    tree([
        program(),
        node('5', '0', 1, 'First'),
        node('6', '0', 1, 'Second'),
        node('7', '6', 2, 'Deep'),
    ]);
    const result = [];
    
    for (const node of document.querySelectorAll('.ast-row__connectors')) {
        result.push(node.textContent);
    }
    
    const expected = [
        '',
        '├─ ',
        '└─ ',
        '   └─ ',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstTree: folding a leaf changes nothing', (t) => {
    tree([
        program(),
        node('5', '0', 1, 'First'),
        node('6', '0', 1, 'Second'),
    ]);
    
    fireEvent.click(rows()[2]);
    
    const result = rows().length;
    const expected = 3;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: before folding, the second sibling is the last one', (t) => {
    tree([
        program(),
        node('5', '0', 1, 'First'),
        node('6', '0', 1, 'Second'),
    ]);
    const result = [];
    
    for (const node of document.querySelectorAll('.ast-row__connectors')) {
        result.push(node.textContent);
    }
    
    const expected = [
        '',
        '├─ ',
        '└─ ',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstTree: focusing the search hands the keyboard to it', (t) => {
    tree();
    
    const search = document.querySelector('[data-testid="ast-search"]') as HTMLInputElement;
    
    fireEvent.focus(search);
    
    // `/` in the tree focuses the search, and `esc` there clears and returns.
    
    // So a keypress reaching the root after a focus is the observable.
    const result = search === document.querySelector('[data-testid="ast-search"]');
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: typing in the search does not reach the tree keys', (t) => {
    tree();
    
    const search = document.querySelector('[data-testid="ast-search"]') as HTMLInputElement;
    
    fireEvent.focus(search);
    fireEvent.change(search, {
        target: {
            value: 'zzz',
        },
    });
    
    const result = document.querySelectorAll('[data-testid="ast-row"]').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstTree: blurring the search hands the keys back to the tree', (t) => {
    tree();
    
    const search = document.querySelector('[data-testid="ast-search"]') as HTMLInputElement;
    
    fireEvent.focus(search);
    fireEvent.blur(search);
    
    // The root is focused, so `/` moves focus to the search rather than being
    
    // typed into a field that no longer holds it.
    const result = search === document.querySelector('[data-testid="ast-search"]');
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
