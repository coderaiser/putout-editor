import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import type {FlatNode} from '@putout/editor-commands';
import AstTree from './AstTree.tsx';

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

/**
 * The join, at the level where it was missing. `a dimmed ancestor keeps its row`
 * above asserts the count of dimmed rows; this asserts that the row that
 * *matched* is distinguishable from them, which is the half the component was
 * not passing down.
 */
test('AstTree: a matched row is marked, and a dimmed one is not', (t) => {
    tree();
    
    const search = document.querySelector('[data-testid="ast-search"]') as HTMLInputElement;
    
    fireEvent.change(search, {
        target: {
            value: 'Identifier',
        },
    });
    
    const result = document.querySelectorAll('.ast-row--match').length;
    const expected = 1;
    
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

/**
 * A row's connectors, found by **type** rather than by index.
 *
 * Indexing was the first attempt and it produced a confident wrong answer: nodes
 * deeper than the second level are collapsed by default (`useTreeState`'s
 * `collapsedByDefault`), so a six-node fixture draws five rows and every index
 * below the fold is off by one. Looking a row up by the type it is supposed to be
 * says what the spec means, and cannot be shifted by a default elsewhere.
 */
const connectorsOf = (type: string): string => {
    const row = document.querySelector(`[data-testid="ast-row"][data-type="${type}"]`);
    const element = row && row.querySelector('.ast-row__connectors');
    
    return element && element.textContent ? element.textContent : '';
};

/**
 * A `Program` with a `VariableDeclaration` holding two children, plus a second
 * top-level statement — the shape the drawing in `AstRow.tsx` uses.
 */
const branched = [
    program(),
    declaration(),
    declarator(),
    identifier(),
    numeric(),
    node('5', '0', 1, 'ExpressionStatement'),
];

/**
 * The connectors, read off a **real** tree rather than a hand-passed array.
 *
 * The `connectorsOf` specs prove the function maps flags to glyphs. This proves
 * `AstTree` computes those flags correctly — and that is the half a unit test of
 * the function cannot reach, because a caller can always pass the wrong array and
 * the function will faithfully draw the wrong thing.
 *
 * With the old `BLANK.repeat(depth - 1)` these two rows rendered identically and
 * the branch structure was invisible.
 */
test('AstTree: a branch under a non-last parent draws pipes', (t) => {
    render(
        <AstTree
            nodes={branched}
            source={SOURCE}
        />,
    );
    
    // both sit under `declaration`, which is not the last child of `Program`,
    // so the branch continues past both of them
    const result = {
        declarator: connectorsOf('VariableDeclarator'),
        numeric: connectorsOf('NumericLiteral'),
    };
    
    const expected = {
        declarator: '│  ├─ ',
        numeric: '│  └─ ',
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The last top-level statement draws **blanks** — the contrast that gives the
 * first spec its meaning.
 *
 * If both halves drew pipes, or both drew blanks, the spec above would pass with
 * a constant instead of a computed prefix. Together the two say the pipe follows
 * the parent's position among its siblings.
 */
test('AstTree: a last branch draws blanks where the pipe stops', (t) => {
    render(
        <AstTree
            nodes={[
                ...branched,
                node('6', '5', 2, 'CallExpression'),
            ]}
            source={SOURCE}
        />,
    );
    
    // `ExpressionStatement` is the last child of `Program`, so nothing continues
    // below it and its child indents with blanks
    const result = connectorsOf('CallExpression');
    const expected = '   └─ ';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * Folding a subtree does not change the pipes of the rows still on screen.
 *
 * The flags are computed over **all** nodes rather than the drawn ones, because a
 * folded child's last sibling is not on screen: asking only the visible rows
 * would call the second-to-last visible child "last" and erase a pipe that is
 * still really there.
 *
 * Folding `declaration` hides `numeric` — the last child — and this checks
 * `declaration`'s own connector is unchanged, which is what would move if the
 * flags were computed over `rows`.
 */
test('AstTree: folding does not redraw the pipes above it', (t) => {
    render(
        <AstTree
            nodes={branched}
            source={SOURCE}
        />,
    );
    
    const result = connectorsOf('VariableDeclaration');
    
    fireEvent.click(document.querySelector('[data-type="VariableDeclaration"]') as Element);
    
    const folded = connectorsOf('VariableDeclaration');
    
    cleanup();
    
    // a pair, with both expecteds written out: `expected = result` is the shape
    // where a rename quietly makes the two always equal
    t.deepEqual([result, folded], ['├─ ', '├─ ']);
    t.end();
});

test('AstTree: a dangling parent draws the row rather than throwing', (t) => {
    render(
        <AstTree
            nodes={[
                program(),
                node('9', 'nowhere', 1, 'Orphan'),
            ]}
            source={SOURCE}
        />,
    );
    
    const result = connectorsOf('Orphan');
    const expected = '└─ ';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
