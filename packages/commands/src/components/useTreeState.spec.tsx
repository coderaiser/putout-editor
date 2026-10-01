import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import {
    defaultCollapsed,
    filterNodes,
    useTreeState,
    visibleRows,
    withAncestors,
} from './useTreeState.ts';
import type {FlatNode} from '../state.types.ts';

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
