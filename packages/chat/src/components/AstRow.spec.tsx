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
    key: '',
    type: 'Program',
    detail: '',
    line: 1,
    col: 0,
    endLine: 1,
    endCol: 10,
    ...over,
});

const row = (over: Partial<FlatNode> = {}, mobile?: boolean) => render(
    <AstRow
        ancestorLastFlags={[]}
        hasChildren={false}
        collapsed={false}
        dimmed={false}
        matched={false}
        last={false}
        mobile={mobile}
        node={node(over)}
        onSelect={noop}
        onToggle={noop}
        selected={false}
    />,
);

/**
 * Connectors are a tree drawing. `ancestorLastFlags` has one boolean per
 * ancestor, root first: `false` draws `│  `, `true` draws blanks.
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
    const result = connectorsOf(2, true, [true, false]);
    
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
    const result = connectorsOf(2, false, [true, true]);
    
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
    const result = connectorsOf(3, false, [true, false, true]);
    
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
 * A row in `matched` gets the match class. An ancestor on the path does not.
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
 * A coarse pointer fires `click` on `pointerup`. On a touchscreen a tap
 * selects only; the keys (`h`/`l`, space, enter) and the caret fold.
 */
test('AstRow: a coarse pointer selects AND toggles', (t) => {
    const toggled: string[] = [];
    const picked: string[] = [];
    
    const onToggle = (id: string) => {
        toggled.push(id);
    };
    
    const onSelect = (id: string) => {
        picked.push(id);
    };
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            hasChildren={true}
            collapsed={false}
            dimmed={false}
            matched={false}
            last={false}
            mobile={true}
            node={node({
                id: '4',
            })}
            onSelect={onSelect}
            onToggle={onToggle}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="ast-row"]') as Element);
    
    cleanup();
    
    const result = {
        picked,
        toggled,
    };
    
    const expected = {
        picked: ['4'],
        toggled: ['4'],
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * And the fine pointer keeps the fold, which is the half that stops this being
 * a "tap never folds" change. A regression that dropped the toggle altogether
 * would pass the spec above and break every desktop user, so both arms are
 * pinned.
 */
test('AstRow: a fine pointer still folds on click', (t) => {
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
            mobile={false}
            node={node({
                id: '9',
            })}
            onSelect={noop}
            onToggle={onToggle}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="ast-row"]') as Element);
    
    cleanup();
    
    const expected = ['9'];
    const result = toggled;
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The row has no `paddingLeft`: the connectors are the indent.
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
 * `data-category` on the type span gives the colour: `AstTree.css` selects
 * `.ast-row__type[data-category='call']`. A helper reads it: no optional
 * chaining here.
 */
const category = () => {
    // On the type span, not the row: the attribute moved there so the CSS selector
    // is `.ast-row__type[data-category="x"]` with no ancestor hop. Reading it off
    // the row would return null and fail here, rather than quietly passing.
    const element = document.querySelector('.ast-row__type');
    
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
 * An unknown type gets `data-category="other"`, not `null`. jsdom has no
 * cascade, so the e2e checks the colour.
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

/**
 * Connectors come before the caret, so the `├` of a row is under the `├` of
 * its parent. Check the `children` order.
 */
test('AstRow: connectors are rendered before the caret', (t) => {
    render(
        <AstRow
            ancestorLastFlags={[false, true]}
            collapsed={false}
            dimmed={false}
            hasChildren={true}
            last={false}
            matched={false}
            node={node({
                depth: 2,
                type: 'VariableDeclaration',
            })}
            onSelect={noop}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const row = document.querySelector('[data-testid="ast-row"]') as HTMLElement;
    const children = [...row.children];
    const at = (name: string) => children.findIndex(({classList}) => classList.contains(name));
    
    const result = {
        connectorsBeforeCaret: at('ast-row__connectors') < at('ast-row__caret'),
        caretAfterConnectors: at('ast-row__caret') > 0,
    };
    
    const expected = {
        connectorsBeforeCaret: true,
        caretAfterConnectors: true,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The category attribute sits on the **type span**, not on the row.
 *
 * The colour selectors used to be `.ast-row[data-category="x"] .ast-row__type`,
 * which needed the attribute on an ancestor of the element it colours. With the
 * attribute on the type itself they become `.ast-row__type[data-category="x"]`,
 * and the row no longer carries an attribute nothing reads.
 */
test('AstRow: the type span carries data-category', (t) => {
    row({
        type: 'CallExpression',
    });
    
    const type = document.querySelector('.ast-row__type') as HTMLElement;
    const rowElement = document.querySelector('[data-testid="ast-row"]') as HTMLElement;
    
    const result = {
        onType: type.getAttribute('data-category'),
        onRow: rowElement.getAttribute('data-category'),
    };
    
    const expected = {
        onType: 'call',
        onRow: null,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstRow: tapping the caret toggles on a coarse pointer', (t) => {
    const toggled: string[] = [];
    const push = toggled.push.bind(toggled);
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            collapsed
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile
            node={node({
                id: '0',
            })}
            onSelect={noop}
            onToggle={push}
            selected={false}
        />,
    );
    
    const caret = document.querySelector('[data-testid="ast-row"] .ast-row__caret');
    
    fireEvent.click(caret as Element);
    
    cleanup();
    
    t.deepEqual(toggled, ['0']);
    t.end();
});

test('AstRow: tapping anywhere on the row selects on mobile', (t) => {
    const picked: string[] = [];
    const push = picked.push.bind(picked);
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            collapsed
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile
            node={node({
                id: '0',
            })}
            onSelect={push}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const row = document.querySelector('[data-testid="ast-row"]') as Element;
    fireEvent.click(row);
    
    cleanup();
    
    t.deepEqual(picked, ['0']);
    t.end();
});

test('AstRow: tapping anywhere on the row toggles on mobile', (t) => {
    const toggled: string[] = [];
    const push = toggled.push.bind(toggled);
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            collapsed
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile
            node={node({
                id: '0',
            })}
            onSelect={noop}
            onToggle={push}
            selected={false}
        />,
    );
    
    const row = document.querySelector('[data-testid="ast-row"]') as Element;
    fireEvent.click(row);
    
    cleanup();
    
    t.deepEqual(toggled, ['0']);
    t.end();
});

test('AstRow: tapping anywhere on the row selects on desktop too', (t) => {
    const picked: string[] = [];
    const push = picked.push.bind(picked);
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            collapsed
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile={false}
            node={node({
                id: '0',
            })}
            onSelect={push}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const row = document.querySelector('[data-testid="ast-row"]') as Element;
    fireEvent.click(row);
    
    cleanup();
    
    t.deepEqual(picked, ['0']);
    t.end();
});

test('AstRow: tapping anywhere on the row toggles on desktop too', (t) => {
    const toggled: string[] = [];
    const push = toggled.push.bind(toggled);
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            collapsed
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile={false}
            node={node({
                id: '0',
            })}
            onSelect={noop}
            onToggle={push}
            selected={false}
        />,
    );
    
    const row = document.querySelector('[data-testid="ast-row"]') as Element;
    fireEvent.click(row);
    
    cleanup();
    
    t.deepEqual(toggled, ['0']);
    t.end();
});

test('AstRow: tapping the caret selects — it bubbles to the row', (t) => {
    const selected: string[] = [];
    const push = selected.push.bind(selected);
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            collapsed
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile
            node={node({
                id: '0',
            })}
            onSelect={push}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const caret = document.querySelector('[data-testid="ast-row"] .ast-row__caret');
    
    fireEvent.click(caret as Element);
    
    cleanup();
    
    t.deepEqual(selected, ['0']);
    t.end();
});

test('AstRow: tapping the caret toggles — it bubbles to the row', (t) => {
    const toggled: string[] = [];
    const push = toggled.push.bind(toggled);
    
    render(
        <AstRow
            ancestorLastFlags={[]}
            collapsed
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile
            node={node({
                id: '0',
            })}
            onSelect={noop}
            onToggle={push}
            selected={false}
        />,
    );
    
    const caret = document.querySelector('[data-testid="ast-row"] .ast-row__caret');
    
    fireEvent.click(caret as Element);
    
    cleanup();
    
    t.deepEqual(toggled, ['0']);
    t.end();
});

test('AstRow: the key is drawn before the type', (t) => {
    row({
        key: 'init',
        type: 'NumericLiteral',
    });
    
    const key = document.querySelector('[data-testid="ast-row"] .ast-row__key');
    const result = key && key.textContent;
    const expected = 'init:';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: the root draws no key', (t) => {
    row();
    
    const result = document.querySelector('[data-testid="ast-row"] .ast-row__key');
    
    cleanup();
    
    t.equal(result, null);
    t.end();
});
