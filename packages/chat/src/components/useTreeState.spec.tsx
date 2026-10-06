import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import type {FlatNode} from '@putout/editor-commands';
import {
    defaultCollapsed,
    expandMove,
    filterNodes,
    foldMove,
    rowsOf,
    useTreeState,
    type TreeMove,
    visibleRows,
    withAncestors,
} from './useTreeState.ts';

const node = (id: string, pid: string | null, depth: number, type = 'Node', detail = ''): FlatNode => ({
    id,
    pid,
    depth,
    type,
    detail,
    line: 1,
    col: 0,
    endLine: 1,
    endCol: 1,
});

/**
 * `[...set].sort()` is what puts a Set's members in a stable order for an
 * assertion, and it is a fixed point for putout: `spread/remove-useless-array`
 * rewrites it to `set.sort()`, which does not exist, and
 * `tape/extract-result-from-assertion` then pulls the whole expression out of
 * the spec. A named helper is the way out.
 */
const sorted = (ids: Set<string>) => [...ids].sort();

const idsOf = (rows: FlatNode[]) => {
    const ids: string[] = [];
    
    for (const {id} of rows)
        ids.push(id);
    
    return ids;
};

const textsOf = (name: string) => {
    const texts: (string | null)[] = [];
    
    for (const element of document.querySelectorAll(`[data-testid="${name}"]`))
        texts.push(element.textContent);
    
    return texts;
};

const program = () => node('0', null, 0, 'Program');
const declaration = () => node('1', '0', 1, 'VariableDeclaration');
const declarator = () => node('2', '1', 2, 'VariableDeclarator');
const identifier = () => node('3', '2', 3, 'Identifier', '"a"');
const numeric = () => node('4', '1', 2, 'NumericLiteral', '1');

/**
 * The tree these tests navigate, as parent/child:
 *
 *     Program
 *     - VariableDeclaration
 *       - VariableDeclarator
 *         - Identifier
 *       - NumericLiteral
 */
const tree: FlatNode[] = [
    program(),
    declaration(),
    declarator(),
    identifier(),
    numeric(),
];

/**
 * `ArrowRight` / `ArrowLeft`, as the two pure moves every tree viewer has.
 *
 * Both answer with a `TreeMove` rather than an id, because "select this same
 * node" is ambiguous on its own: `ArrowRight` on a collapsed node and
 * `ArrowLeft` on an expanded one both name the node that is already selected,
 * and in the first it has to expand and in the second it has to collapse. So
 * the move says which, and the handler applies it — which is also what keeps
 * these testable without a component.
 */
test('useTreeState: expandMove expands a collapsed node', (t) => {
    const collapsed = new Set(['1']);
    
    const result = expandMove(tree, collapsed, '1', rowsOf(tree, collapsed, ''));
    const expected: TreeMove = {
        kind: 'fold',
        id: '1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: expandMove on an expanded node moves to its first child', (t) => {
    const collapsed = new Set(['3']);
    
    const result = expandMove(tree, collapsed, '1', rowsOf(tree, collapsed, ''));
    const expected: TreeMove = {
        kind: 'walk',
        id: '2',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: expandMove on a leaf is a no-op', (t) => {
    const collapsed = new Set<string>();
    
    const result = expandMove(tree, collapsed, '4', rowsOf(tree, collapsed, ''));
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: expandMove with nothing selected takes the first row', (t) => {
    const collapsed = new Set<string>();
    
    const result = expandMove(tree, collapsed, null, rowsOf(tree, collapsed, ''));
    const expected: TreeMove = {
        kind: 'walk',
        id: '0',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: expandMove on an empty tree is a no-op', (t) => {
    const result = expandMove([], new Set<string>(), null, []);
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: foldMove collapses an expanded node', (t) => {
    const collapsed = new Set(['3']);
    
    const result = foldMove(tree, collapsed, '1');
    const expected: TreeMove = {
        kind: 'fold',
        id: '1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: foldMove on a collapsed node walks out to its parent', (t) => {
    const collapsed = new Set(['1', '3']);
    
    const result = foldMove(tree, collapsed, '1');
    const expected: TreeMove = {
        kind: 'walk',
        id: '0',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: foldMove on a collapsed root is a no-op', (t) => {
    const collapsed = new Set(['0']);
    
    const result = foldMove(tree, collapsed, '0');
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: foldMove on a leaf is a no-op', (t) => {
    const collapsed = new Set(['3']);
    
    const result = foldMove(tree, collapsed, '4');
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: foldMove with nothing selected is a no-op', (t) => {
    const result = foldMove(tree, new Set<string>(), null);
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: foldMove on an id that is not in the tree is a no-op', (t) => {
    const result = foldMove(tree, new Set<string>(), 'nowhere');
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The bug this pins: `rows` was `filterNodes(visibleRows(...))`, so the default
 * fold hid a match before the search could reach it and searching for a deep
 * node type returned nothing. A query has to see the whole tree.
 */
test('useTreeState: a query finds a row the default fold hides', (t) => {
    const result = rowsOf(tree, defaultCollapsed(tree), 'Identifier');
    const expected = [
        '0',
        '1',
        '2',
        '3',
    ];
    
    t.deepEqual(result.map(({id}) => id), expected);
    t.end();
});

test('useTreeState: rowsOf with no query returns the folded view', (t) => {
    const result = rowsOf(tree, defaultCollapsed(tree), '');
    const expected = [
        '0',
        '1',
        '2',
        '4',
    ];
    
    t.deepEqual(result.map(({id}) => id), expected);
    t.end();
});

test('useTreeState: withAncestors keeps the path to a match', (t) => {
    const result = sorted(withAncestors(new Set(['3']), tree));
    const expected = [
        '0',
        '1',
        '2',
        '3',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: withAncestors handles a match whose parent is unknown', (t) => {
    const result = sorted(withAncestors(new Set(['9']), tree));
    const expected = ['9'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: withAncestors stops at the root', (t) => {
    const result = sorted(withAncestors(new Set(['0']), tree));
    const expected = ['0'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: filterNodes with no query returns every row', (t) => {
    const result = filterNodes(tree, '  ').rows.length;
    const expected = 5;
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: filterNodes matches on type', (t) => {
    const result = idsOf(filterNodes(tree, 'identifier').rows);
    const expected = [
        '0',
        '1',
        '2',
        '3',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: filterNodes matches on detail', (t) => {
    const result = filterNodes(tree, '"a"').matched.has('3');
    const expected = true;
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: filterNodes dims the ancestors of a match', (t) => {
    const result = sorted(filterNodes(tree, 'identifier').dimmed);
    const expected = ['0', '1', '2'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: filterNodes hides a subtree with no match', (t) => {
    const result = idsOf(filterNodes(tree, 'NumericLiteral').rows);
    const expected = ['0', '1', '4'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: defaultCollapsed collapses everything below depth 1', (t) => {
    const result = sorted(defaultCollapsed(tree));
    const expected = ['2', '3', '4'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: visibleRows hides the children of a collapsed node', (t) => {
    const result = idsOf(visibleRows(tree, new Set(['1'])));
    const expected = ['0', '1'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: visibleRows hides a grandchild of a collapsed node', (t) => {
    const result = idsOf(visibleRows(tree, new Set(['2'])));
    const expected = [
        '0',
        '1',
        '2',
        '4',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: visibleRows shows everything when nothing is collapsed', (t) => {
    const result = visibleRows(tree, new Set()).length;
    const expected = 5;
    
    t.equal(result, expected);
    t.end();
});

/**
 * The keyboard half. The listener is bound to the root div rather than
 * `document`, so a second tree on the same page — the chat message and the
 * console panel — does not answer the same keypress, and that is the part worth
 * pinning: the `document` version passes every test below too.
 */
interface HarnessProps {
    nodes: FlatNode[];
}

const Harness = ({nodes}: HarnessProps) => {
    const state = useTreeState(nodes);
    
    return (
        <div
            ref={state.root}
            data-testid="root"
            tabIndex={0}
        >
            <span data-testid="focus">
                {state.focus}
            </span>
            <span data-testid="selected">
                {state.selected || '-'}
            </span>
            <span data-testid="query">
                {state.query}
            </span>
            <span data-testid="rows">
                {state.visible.rows.length}
            </span>
            <button
                data-testid="select"
                onClick={() => state.select('2')}
                type="button"
            >
                select
            </button>
            <button
                data-testid="filter"
                onClick={() => state.setQuery('Identifier')}
                type="button"
            >
                filter
            </button>
        </div>
    );
};

const press = (key: string) => {
    pressOn(document.querySelector('[data-testid="root"]'), key);
};

const pressOn = (element: Element | null, key: string) => {
    act(() => {
        if (element)
            element.dispatchEvent(new KeyboardEvent('keydown', {
                key,
                bubbles: true,
            }));
    });
};

/** The first of the two trees the two-tree test renders. */
const firstRoot = () => document.querySelector('[data-testid="root"]');

const read = (name: string) => {
    const element = document.querySelector(`[data-testid="${name}"]`);
    
    return element && element.textContent;
};

test('useTreeState: arrow down selects the first row', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowDown');
    
    const expected = '0';
    const result = read('selected');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The two arrow keys, over the real listener rather than the pure moves — the
 * pure specs above say what each move *decides*, and cannot notice that the key
 * was never bound to it.
 */
test('useTreeState: ArrowRight walks into a child', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    // Nothing is selected, so the first `ArrowRight` takes the first row...
    press('ArrowRight');
    
    // ...and the second walks into `Program`'s child.
    press('ArrowRight');
    
    const expected = '1';
    const result = read('selected');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: ArrowRight expands a folded node where it stands', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowRight');
    press('ArrowDown');
    press('ArrowDown');
    
    // `2` is a `VariableDeclarator`, and `defaultCollapsed` folds everything
    
    // below depth 1, so it is shut and `ArrowRight` reveals its own children
    
    // without moving off it: `VariableDeclarator`'s own child appears, so three
    
    // rows become four, and the selection stays where it was.
    press('ArrowRight');
    
    const result = read('rows');
    const expected = '5';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: ArrowLeft folds the selected node', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowRight');
    press('ArrowDown');
    
    press('ArrowLeft');
    
    // `Program` folds, and its child goes with it: two rows left.
    const result = read('rows');
    const expected = '2';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: ArrowLeft on a folded node walks out to its parent', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowRight');
    press('ArrowDown');
    press('ArrowDown');
    press('ArrowRight');
    press('ArrowLeft');
    press('ArrowLeft');
    
    const expected = '1';
    const result = read('selected');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: ArrowLeft on the root is a no-op', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowRight');
    press('ArrowLeft');
    
    const expected = '0';
    const result = read('selected');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: ArrowRight with nothing drawn is a no-op', (t) => {
    render(
        <Harness nodes={[]}/>,
    );
    
    press('ArrowRight');
    
    const expected = '-';
    const result = read('selected');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: ArrowLeft folds a root with nothing under it', (t) => {
    render(
        <Harness nodes={[
            program(),
        ]}/>,
    );
    
    press('ArrowRight');
    press('ArrowLeft');
    
    const expected = '0';
    const result = read('selected');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: j and k navigate too', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('j');
    press('j');
    press('k');
    
    const expected = '0';
    const result = read('selected');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: slash moves focus to the search', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('/');
    
    const expected = 'search';
    const result = read('focus');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: escape in search clears the query and returns focus', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('/');
    press('Escape');
    
    const expected = 'tree';
    const result = read('focus');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `h` and `l`, the vim spellings of the two arrows.
 *
 * Bound to the *same* handler arms as `ArrowLeft`/`ArrowRight` rather than to
 * copies of them, which is why the assertions are about the tree's own state:
 * a separate implementation would drift from the arrow the first time one of
 * them changed. Tree-only, because `state.focus === 'search'` returns before
 * the `h`/`l` arms — asserted separately below.
 */
test('useTreeState: h folds what ArrowLeft folds', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    // `ArrowRight` selects row 0 and expands `Program`, so three rows are drawn
    // and `ArrowDown` can walk to row 1 — the two drawn by default would not
    // leave a row below the top to navigate to.
    press('ArrowRight');
    press('ArrowDown');
    press('h');
    
    const result = {
        // `VariableDeclaration` folds in place: same row, children hidden
        rows: read('rows'),
        selected: read('selected'),
    };
    
    cleanup();
    
    const expected = {
        rows: '2',
        selected: '1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: l expands what ArrowRight expands', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowRight');
    press('ArrowDown');
    press('l');
    
    const result = read('rows');
    
    cleanup();
    const expected = '4';
    
    t.equal(result, expected);
    t.end();
});

/**
 * The guard, as its own test.
 *
 * With focus on the filter, `h` must type an `h` and nothing else — no fold, no
 * selection change. One combined test would pass if `h` did *both*.
 */
test('useTreeState: h and l do nothing while the filter has focus', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('/');
    const before = read('rows');
    
    press('h');
    press('l');
    
    const result = {
        focus: read('focus'),
        // counted, not spelled out: the fixture's row count is its own detail,
        // and "the letters changed nothing" is the claim
        unchanged: read('rows') === before,
    };
    
    cleanup();
    
    const expected = {
        focus: 'search',
        unchanged: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Tab out of the tree and into the filter — the cycle the plan draws:
 *
 *     editor -> Tab -> tree -> Tab -> filter -> Tab -> editor
 *
 * `preventDefault` is what keeps it: without it the browser moves focus as well
 * and the handler's `setFocus('search')` races the browser's own tab order to
 * the next focusable element. `e2e/desktop.ts` is what proves the race is
 * settled in the filter's favour; the observable here is the state.
 */
test('useTreeState: Tab in tree mode sets focus to the search', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('Tab');
    
    const expected = 'search';
    const result = read('focus');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: Tab in search mode returns focus to the tree', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('Tab');
    press('Tab');
    
    const expected = 'tree';
    const result = read('focus');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `k` on the **first** row hands over to the filter, and does so **without
 * moving the selection**.
 *
 * "First" means the first *drawn* row, not the first node — a query that leaves
 * three of fifty rows on screen still has a top, and a filter that made `k` walk
 * to a hidden row would be worse than not having it. The fixture folds below
 * depth 1, so `ArrowDown` lands on `Program` and the second `k` is under test.
 *
 * `k` rather than `j`: plan.md's cycle diagram says "k / ArrowUp (from Program =
 * first row) → moves focus to filter input", and the filter bar renders above
 * the tree. The prose under the diagram names `j`/`ArrowDown`, which cannot
 * work — two rows are drawn by default, so `j` from the first can never reach
 * the second. See `docs/issues/chat.md`.
 */
test('useTreeState: k from the first row moves focus to the search', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowDown');
    const atTop = read('selected');
    
    press('k');
    
    const result = {
        focus: read('focus'),
        selected: read('selected'),
    };
    
    cleanup();
    
    const expected = {
        focus: 'search',
        selected: atTop,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: ArrowUp from the first row moves focus to the search too', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowDown');
    press('ArrowUp');
    
    const expected = 'search';
    const result = read('focus');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `k` **below** the top keeps walking up — the other half of the rule, and the
 * one a `k`-always-focuses-the-filter implementation gets wrong.
 *
 * `ArrowRight` twice first, because the fixture draws two rows and one `k` is
 * not enough to be below the top: `ArrowRight` selects row 0 and expands it,
 * the second walks into row 1.
 */
test('useTreeState: k below the first row keeps selecting', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    // expand `Program`, then walk two rows down, so `k` is not at the top
    press('ArrowRight');
    press('ArrowDown');
    press('ArrowDown');
    press('k');
    
    const result = {
        focus: read('focus'),
        selected: read('selected'),
    };
    
    cleanup();
    
    const expected = {
        focus: 'tree',
        // one row back up from `VariableDeclarator`
        selected: '1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `k` from the filter goes back up to the tree, and `k` in the tree still walks
 * up. One key, two behaviours keyed on focus — which is why they are separate
 * tests rather than one that presses both.
 */
test('useTreeState: k in search mode sets focus to the tree', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('/');
    press('k');
    
    const expected = 'tree';
    const result = read('focus');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: k in tree mode still walks up', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowDown');
    press('ArrowDown');
    press('k');
    
    const result = {
        focus: read('focus'),
        selected: read('selected'),
    };
    
    cleanup();
    
    const expected = {
        focus: 'tree',
        selected: '0',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `ArrowUp` in the filter is the same as `k`, and **it clears the query**.
 *
 * The clear is the half that is easy to lose: the plan has `k`/`ArrowUp`
 * clearing and returning, matching `Escape`. A filter that keeps its text but
 * loses focus leaves the user looking at a filtered tree with no filter box and
 * no obvious way back, so the query is asserted alongside the focus.
 */
test('useTreeState: ArrowUp in search mode clears the query and returns focus', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('/');
    act(() => {
        const button = document.querySelector('[data-testid="filter"]') as HTMLButtonElement;
        button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    });
    
    press('ArrowUp');
    
    const result = {
        focus: read('focus'),
        query: read('query'),
    };
    
    cleanup();
    
    const expected = {
        focus: 'tree',
        query: '',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('useTreeState: collapse hides a subtree, and space expands it again', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    press('ArrowDown');
    press(' ');
    
    const result = read('rows');
    
    press(' ');
    
    cleanup();
    const expected = '5';
    
    t.notEqual(result, expected);
    t.end();
});

/**
 * The reason the listener is bound to the root and not to `document`. Two trees
 * on one page — the chat message and the console panel — each keep their own
 * selection, and a keypress on one does not move the other.
 */
test('useTreeState: navigation on an empty tree changes nothing', (t) => {
    render(
        <Harness nodes={[]}/>,
    );
    
    press('ArrowDown');
    const result = read('selected');
    
    cleanup();
    const expected = '-';
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: select sets the selection directly', (t) => {
    render(
        <Harness nodes={tree}/>,
    );
    
    const button = document.querySelector('[data-testid="select"]');
    
    act(() => {
        if (button)
            button.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
            }));
    });
    
    const result = read('selected');
    
    cleanup();
    const expected = '2';
    
    t.equal(result, expected);
    t.end();
});

test('useTreeState: two trees keep separate selections', (t) => {
    render(
        <div>
            <Harness nodes={tree}/>
            <Harness nodes={tree}/>
        </div>,
    );
    
    pressOn(firstRoot(), 'ArrowDown');
    
    const result = textsOf('selected');
    const expected = ['0', '-'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});
