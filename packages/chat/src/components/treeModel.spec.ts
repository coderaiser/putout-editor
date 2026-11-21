import {test} from 'supertape';
import {
    idsOf,
    node,
    sorted,
    textOf,
    tree,
} from '#test/tree';
import {
    defaultCollapsed,
    expandMove,
    filterNodes,
    foldMove,
    type Layout,
    layoutOf,
    rowsOf,
    type TreeMove,
    visibleOf,
    visibleRows,
    withAncestors,
} from './treeModel.ts';

/**
 * `ArrowRight` / `ArrowLeft` return a `TreeMove`, not an id: on the selected
 * node, one expands and the other collapses.
 */
test('treeModel: expandMove expands a collapsed node', (t) => {
    const collapsed = new Set(['1']);
    
    const result = expandMove(tree, collapsed, '1', rowsOf(tree, collapsed, '', textOf));
    const expected: TreeMove = {
        kind: 'fold',
        id: '1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: expandMove on an expanded node moves to its first child', (t) => {
    const collapsed = new Set(['3']);
    
    const result = expandMove(tree, collapsed, '1', rowsOf(tree, collapsed, '', textOf));
    const expected: TreeMove = {
        kind: 'walk',
        id: '2',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: expandMove on a leaf is a no-op', (t) => {
    const collapsed = new Set<string>();
    
    const result = expandMove(tree, collapsed, '4', rowsOf(tree, collapsed, '', textOf));
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: expandMove with nothing selected takes the first row', (t) => {
    const collapsed = new Set<string>();
    
    const result = expandMove(tree, collapsed, null, rowsOf(tree, collapsed, '', textOf));
    const expected: TreeMove = {
        kind: 'walk',
        id: '0',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: expandMove on an empty tree is a no-op', (t) => {
    const result = expandMove([], new Set<string>(), null, []);
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: foldMove collapses an expanded node', (t) => {
    const collapsed = new Set(['3']);
    
    const result = foldMove(tree, collapsed, '1');
    const expected: TreeMove = {
        kind: 'fold',
        id: '1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: foldMove on a collapsed node walks out to its parent', (t) => {
    const collapsed = new Set(['1', '3']);
    
    const result = foldMove(tree, collapsed, '1');
    const expected: TreeMove = {
        kind: 'walk',
        id: '0',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: foldMove on a collapsed root is a no-op', (t) => {
    const collapsed = new Set(['0']);
    
    const result = foldMove(tree, collapsed, '0');
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: foldMove on a leaf is a no-op', (t) => {
    const collapsed = new Set(['3']);
    
    const result = foldMove(tree, collapsed, '4');
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: foldMove with nothing selected is a no-op', (t) => {
    const result = foldMove(tree, new Set<string>(), null);
    const expected: TreeMove = {
        kind: 'noop',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: foldMove on an id that is not in the tree is a no-op', (t) => {
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
test('treeModel: a query finds a row the default fold hides', (t) => {
    const result = rowsOf(tree, defaultCollapsed(tree), 'Identifier', textOf);
    const expected = [
        '0',
        '1',
        '2',
        '3',
    ];
    
    t.deepEqual(result.map(({id}) => id), expected);
    t.end();
});

test('treeModel: rowsOf with no query returns the folded view', (t) => {
    const result = rowsOf(tree, defaultCollapsed(tree), '', textOf);
    const expected = [
        '0',
        '1',
        '2',
        '4',
    ];
    
    t.deepEqual(result.map(({id}) => id), expected);
    t.end();
});

test('treeModel: withAncestors keeps the path to a match', (t) => {
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

test('treeModel: withAncestors handles a match whose parent is unknown', (t) => {
    const result = sorted(withAncestors(new Set(['9']), tree));
    const expected = ['9'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: withAncestors stops at the root', (t) => {
    const result = sorted(withAncestors(new Set(['0']), tree));
    const expected = ['0'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: filterNodes with no query returns every row', (t) => {
    const result = filterNodes(tree, '  ', textOf).rows.length;
    const expected = 5;
    
    t.equal(result, expected);
    t.end();
});

test('treeModel: filterNodes matches on type', (t) => {
    const result = idsOf(filterNodes(tree, 'identifier', textOf).rows);
    const expected = [
        '0',
        '1',
        '2',
        '3',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: filterNodes matches on detail', (t) => {
    const result = filterNodes(tree, '"a"', textOf).matched.has('3');
    
    t.ok(result);
    t.end();
});

test('treeModel: filterNodes dims the ancestors of a match', (t) => {
    const result = sorted(filterNodes(tree, 'identifier', textOf).dimmed);
    const expected = ['0', '1', '2'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: filterNodes hides a subtree with no match', (t) => {
    const result = idsOf(filterNodes(tree, 'NumericLiteral', textOf).rows);
    const expected = ['0', '1', '4'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: defaultCollapsed collapses everything below depth 1', (t) => {
    const result = sorted(defaultCollapsed(tree));
    const expected = ['2', '3', '4'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: visibleRows hides the children of a collapsed node', (t) => {
    const result = idsOf(visibleRows(tree, new Set(['1'])));
    const expected = ['0', '1'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: visibleRows hides a grandchild of a collapsed node', (t) => {
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

test('treeModel: visibleRows shows everything when nothing is collapsed', (t) => {
    const result = visibleRows(tree, new Set()).length;
    const expected = 5;
    
    t.equal(result, expected);
    t.end();
});

test('treeModel: visibleOf with no query returns the folded view', (t) => {
    const {rows} = visibleOf(tree, new Set(['2']), '', textOf);
    
    const result = idsOf(rows);
    const expected = [
        '0',
        '1',
        '2',
        '4',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: visibleOf with no query matches nothing', (t) => {
    const {matched, dimmed} = visibleOf(tree, new Set(), '', textOf);
    
    const result = [matched.size, dimmed.size];
    const expected = [0, 0];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: visibleOf takes a blank query for no query', (t) => {
    const {rows} = visibleOf(tree, new Set(['2']), '  ', textOf);
    
    const result = idsOf(rows);
    const expected = [
        '0',
        '1',
        '2',
        '4',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: visibleOf with a query ignores the folds', (t) => {
    const {rows} = visibleOf(tree, defaultCollapsed(tree), 'Identifier', textOf);
    
    const result = idsOf(rows);
    const expected = [
        '0',
        '1',
        '2',
        '3',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: visibleOf with a query names the rows that match', (t) => {
    const {matched} = visibleOf(tree, new Set(), 'Identifier', textOf);
    
    const result = sorted(matched);
    const expected = ['3'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: visibleOf with a query dims the path to a match', (t) => {
    const {dimmed} = visibleOf(tree, new Set(), 'Identifier', textOf);
    
    const result = sorted(dimmed);
    const expected = [
        '0',
        '1',
        '2',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: layoutOf has one entry for each node', (t) => {
    const result = sorted(new Set(layoutOf(tree).keys()));
    const expected = [
        '0',
        '1',
        '2',
        '3',
        '4',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: layoutOf: a root is last', (t) => {
    const {last} = layoutOf(tree).get('0') as Layout;
    
    t.ok(last);
    t.end();
});

test('treeModel: layoutOf: a child with a later sibling is not last', (t) => {
    const {last} = layoutOf(tree).get('2') as Layout;
    
    t.notOk(last);
    t.end();
});

test('treeModel: layoutOf: the final child of a parent is last', (t) => {
    const {last} = layoutOf(tree).get('4') as Layout;
    
    t.ok(last);
    t.end();
});

test('treeModel: layoutOf: a node with a child has children', (t) => {
    const {hasChildren} = layoutOf(tree).get('1') as Layout;
    
    t.ok(hasChildren);
    t.end();
});

test('treeModel: layoutOf: a leaf has no children', (t) => {
    const {hasChildren} = layoutOf(tree).get('3') as Layout;
    
    t.notOk(hasChildren);
    t.end();
});

test('treeModel: layoutOf: a root has no ancestor flags', (t) => {
    const {ancestorLastFlags} = layoutOf(tree).get('0') as Layout;
    const expected: boolean[] = [];
    
    t.deepEqual(ancestorLastFlags, expected);
    t.end();
});

test('treeModel: layoutOf: ancestor flags go from the root down', (t) => {
    const {ancestorLastFlags} = layoutOf(tree).get('3') as Layout;
    
    const expected = [true, true, false];
    
    t.deepEqual(ancestorLastFlags, expected);
    t.end();
});

test('treeModel: layoutOf: a missing parent ends the ancestor chain', (t) => {
    const lost = node('9', 'missing', 1);
    const {
        ancestorLastFlags,
        last,
    } = layoutOf([lost]).get('9') as Layout;
    
    const result = {
        ancestorLastFlags,
        last,
    };
    
    const expected = {
        ancestorLastFlags: [],
        last: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeModel: layoutOf: a child may come before its parent', (t) => {
    const child = node('2', '1', 1);
    const parent = node('1', '0', 0);
    const root = node('0', null, 0);
    
    const {ancestorLastFlags} = layoutOf([
        child,
        parent,
        root,
    ]).get('2') as Layout;
    
    const expected = [true, true];
    
    t.deepEqual(ancestorLastFlags, expected);
    t.end();
});

test('treeModel: layoutOf: each root is last, also when there are two', (t) => {
    const first = node('0', null, 0);
    const second = node('1', null, 0);
    const layout = layoutOf([first, second]);
    
    const result = [
        (layout.get('0') as Layout).last,
        (layout.get('1') as Layout).last,
    ];
    
    const expected = [true, true];
    
    t.deepEqual(result, expected);
    t.end();
});
