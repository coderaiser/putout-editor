import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import type {FlatNode} from '@putout/editor-commands';
import AstRow, {caretOf, connectorsOf} from './AstRow.tsx';

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

const noop = () => {};

const node = (over: Partial<FlatNode> = {}): FlatNode => ({
    id: '0',
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

const row = (over: Partial<FlatNode> = {}) => render(
    <AstRow
        ancestorLastFlags={[]}
        hasChildren={false}
        collapsed={false}
        dimmed={false}
        matched={false}
        last={false}
        node={node(over)}
        onSelect={noop}
        onToggle={noop}
        selected={false}
    />,
);

/**
 * The connectors, which are a **tree drawing** and not an indent.
 *
 * They used to be `BLANK.repeat(depth - 1)` then `TEE`/`ELBOW` — three blanks per
 * ancestor level, always, whether or not that ancestor had a sibling after it.
 * The result could not distinguish "the parent is the last of its siblings, so
 * nothing continues on the left" from "it is not, so a `│` belongs here", which
 * is the one thing a tree drawing exists to show.
 *
 * So each row is handed `ancestorLastFlags`: one boolean per ancestor level, from
 * the root down, saying whether *that* ancestor was the last child of its own
 * parent. `false` draws `│  `, `true` draws three blanks. The slice is
 * `[0, depth - 1)` because the immediate parent is the row's own `TEE`/`ELBOW`
 * and has no pipe of its own.
 */
test('AstRow: depth 0 carries no connectors', (t) => {
    const result = connectorsOf(0, false, []);
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: a non-last child gets the tee', (t) => {
    const result = connectorsOf(1, false, [true]);
    const expected = '├─ ';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: a last child gets the elbow', (t) => {
    const result = connectorsOf(1, true, [true]);
    const expected = '└─ ';
    
    t.equal(result, expected);
    t.end();
});

/**
 * The pipe case, which is the whole point: an ancestor that is **not** the last
 * of its siblings has something continuing below it, so the level draws `│`.
 *
 * `[true, false]` at depth 2 reads root-first — the root was last, the parent was
 * not — and the prefix is `[0, 1)`, so one pipe and then this row's elbow.
 */
test('AstRow: a non-last ancestor draws a pipe', (t) => {
    const result = connectorsOf(2, true, [
        true,
        false,
    ]);
    const expected = '│  └─ ';
    
    t.equal(result, expected);
    t.end();
});

/**
 * …and the mirror image: a last ancestor draws blanks, because nothing hangs
 * below it.
 *
 * The pair above is the regression test. With `BLANK.repeat(depth - 1)` this
 * case and the one above rendered **identically**, so a tree could not show
 * where a branch ended.
 */
test('AstRow: a last ancestor draws blanks', (t) => {
    const result = connectorsOf(2, false, [
        true,
        true,
    ]);
    const expected = '   ├─ ';
    
    t.equal(result, expected);
    t.end();
});

/**
 * Mixed ancestors, which is the case a depth count alone cannot express.
 *
 * Pipe at level 0, blank at level 1, tee for this row: `│     ├─ `. The four
 * spaces in the middle are one pipe slot plus one blank slot, and getting the
 * slice wrong by one shifts the whole pattern by a level — so this is the spec
 * that pins the slice.
 */
test('AstRow: mixed ancestors alternate pipe and blank', (t) => {
    const result = connectorsOf(3, false, [
        true,
        false,
        true,
    ]);
    const expected = '│     ├─ ';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: an expanded node shows the open caret', (t) => {
    const result = caretOf(true, false);
    const expected = '▾';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: a collapsed node shows the closed caret', (t) => {
    const result = caretOf(true, true);
    const expected = '▸';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: a leaf shows two spaces, not a caret', (t) => {
    const result = caretOf(false, false);
    const expected = '  ';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: renders the node type', (t) => {
    row({
        type: 'Identifier',
    });
    
    const expected = 'Identifier';
    const result = read('[data-testid="ast-row"]');
    
    cleanup();
    
    t.equal(result && result.includes(expected), true);
    t.end();
});

test('AstRow: renders a detail when there is one', (t) => {
    row({
        detail: '"a"',
    });
    
    const expected = '"a"';
    const result = read('.ast-row__detail');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: omits the detail element when empty', (t) => {
    row();
    
    const result = document.querySelector('.ast-row__detail');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: renders the line:col', (t) => {
    row({
        line: 2,
        col: 7,
    });
    
    const expected = '2:7';
    const result = read('.ast-row__pos');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: carries the selected class', (t) => {
    render(
        <AstRow
            ancestorLastFlags={[]}
            hasChildren={false}
            collapsed={false}
            dimmed={false}
            matched={false}
            last={false}
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected={true}
        />,
    );
    
    const result = document.querySelector('.ast-row--selected') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: carries the dimmed class for an ancestor of a match', (t) => {
    render(
        <AstRow
            ancestorLastFlags={[]}
            hasChildren={false}
            collapsed={false}
            dimmed={true}
            matched={false}
            last={false}
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const result = document.querySelector('.ast-row--dimmed') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The other half of the search, and the one that was never wired.
 *
 * `filterNodes` has computed `matched` - the ids whose own text matches - since
 * the tree was written, and `AstTree.tsx` destructured `{rows, dimmed}` and
 * dropped it. `.ast-match` and `--ast-match` sat in `AstTree.css` unused. So the
 * search filtered and dimmed, and nothing was ever *marked*: the rows that
 * matched looked exactly like the ancestors that were only on the path to one.
 */
test('AstRow: carries the match class for a row that matched', (t) => {
    render(
        <AstRow
            ancestorLastFlags={[]}
            hasChildren={false}
            collapsed={false}
            dimmed={false}
            last={false}
            matched={true}
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const result = document.querySelector('.ast-row--match') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: carries no match class for an ordinary row', (t) => {
    render(
        <AstRow
            ancestorLastFlags={[]}
            hasChildren={false}
            collapsed={false}
            dimmed={false}
            last={false}
            matched={false}
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const result = document.querySelector('.ast-row--match') !== null;
    const expected = false;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: clicking reports the id', (t) => {
    const picked: string[] = [];
    const onSelect = (id: string) => {
        picked.push(id);
    };
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            hasChildren={false}
            collapsed={false}
            dimmed={false}
            matched={false}
            last={false}
            node={node({
                id: '7',
            })}
            onSelect={onSelect}
            onToggle={noop}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="ast-row"]') as Element);
    
    cleanup();
    
    const expected = ['7'];
    const result = picked;
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstRow: clicking a node with children also folds it', (t) => {
    const toggled: string[] = [];
    const onToggle = (id: string) => {
        toggled.push(id);
    };
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            hasChildren={true}
            collapsed={false}
            dimmed={false}
            matched={false}
            last={false}
            node={node({
                id: '2',
            })}
            onSelect={noop}
            onToggle={onToggle}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="ast-row"]') as Element);
    
    cleanup();
    
    const expected = ['2'];
    const result = toggled;
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The row carries **no** `paddingLeft`, and that is the point.
 *
 * It used to be `depth * 12` on top of the connector characters, which double
 * counted the indent: a depth-3 row was 36px further right *and* six characters
 * in. The connectors are the indent now, and they are proportional to the actual
 * tree rather than to a guess about character width.
 *
 * Asserted as its own spec because it is a removal, and a removal has no
 * failure mode anyone notices until the tree is deeply nested and pushed off
 * screen — which no jsdom measurement would catch.
 */
test('AstRow: the indent is the connectors, not padding', (t) => {
    row({
        depth: 3,
    });
    
    const element = document.querySelector('[data-testid="ast-row"]') as HTMLElement;
    const result = element.style.paddingLeft;
    const expected = '';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `data-category`, which is how the row gets its colour.
 *
 * An **attribute**, not an inline `style` and not a class per category. The
 * reason is that `AstTree.css` selects on it — `.ast-row[data-category="call"]
 * .ast-row__type { color: var(--ast-c-call) }` — so the eight colours are one
 * stylesheet concern and adding a ninth type is a `Set` entry plus a selector,
 * with no JSX edit and no `style` prop that could drift from the stylesheet.
 *
 * Read off the DOM because a category that is computed but not applied is the
 * failure this is here to catch.
 *
 * The attribute is read through a helper rather than with `?.` on the spot:
 * optional chaining is off in this repo, and one helper keeps the two cases
 * below saying only what they are about.
 */
const category = () => {
    const element = document.querySelector('[data-testid="ast-row"]');
    
    return element && element.getAttribute('data-category');
};

test('AstRow: carries its type category as data-category', (t) => {
    row({
        type: 'CallExpression',
    });
    
    const result = category();
    const expected = 'call';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The unknown-type arm, on the row rather than only on the function.
 *
 * `categoryOf` returns `other` for anything it does not know, and this is what
 * that looks like in the DOM: an attribute whose value no selector in
 * `AstTree.css` matches, so the row keeps `.ast-row__type`'s accent. jsdom has
 * no cascade, so the *colour* is the e2e's job — what is checked here is that
 * the attribute is present and says `other` rather than `null`.
 */
test('AstRow: an unknown type falls back to the other category', (t) => {
    row({
        type: 'SomethingUnknown',
    });
    
    const result = category();
    const expected = 'other';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
