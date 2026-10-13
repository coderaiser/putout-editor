import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import type {FlatLearnNode} from '@putout/editor-commands';
import LearnRow from './LearnRow.tsx';

const noop = () => {};

/**
 * A row built by hand rather than through `flattenLearn`.
 *
 * `LearnTree.spec.tsx` takes its rows from the command, and that is right there
 * — the tree's whole job is to draw what `flattenLearn` produced. Here the
 * subject is the row's own handler, so a hand-built node is the honest fixture:
 * the spec would otherwise break on a `flattenLearn` change that has nothing to
 * do with whether a tap folds.
 */
const node = (over: Partial<FlatLearnNode> = {}): FlatLearnNode => ({
    id: '0',
    pid: null,
    depth: 0,
    label: 'putout',
    summary: 'the tool',
    body: 'body',
    hasExample: false,
    hasChildren: false,
    ...over,
});

const row = (over: Partial<FlatLearnNode> = {}, mobile?: boolean) => render(
    <LearnRow
        ancestorLastFlags={[]}
        collapsed={false}
        dimmed={false}
        hasChildren={false}
        last={false}
        matched={false}
        mobile={mobile}
        node={node(over)}
        onSelect={noop}
        onToggle={noop}
        selected={false}
    />,
);

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

test('LearnRow: renders the label', (t) => {
    row();
    
    const result = read('.ast-row__type');
    const expected = 'putout';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnRow: renders the summary as the detail', (t) => {
    row();
    
    const result = read('.ast-row__detail');
    const expected = 'the tool';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A concept has no position in a file, so the row carries no `line:col`.
 *
 * The one place `LearnRow` and `AstRow` deliberately differ: an AST row shows
 * `1:0` because a `line:col` refers to it, and a learn row showing a position
 * would be asserting a fact about a concept that does not exist.
 */
test('LearnRow: carries no position, because a concept has none', (t) => {
    row();
    
    const result = document.querySelectorAll('.ast-row__pos').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A row with children folds on a fine pointer, which is the half that was
 * missing entirely.
 *
 * `LearnTree`'s inline row called `onSelect` and nothing else, so no learn tree
 * could be folded by pointer on **any** device — the caret was decoration. This
 * is the desktop half of that fix.
 */
test('LearnRow: clicking a node with children also folds it', (t) => {
    const toggled: string[] = [];
    
    render(
        <LearnRow
            ancestorLastFlags={[]}
            collapsed={false}
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile={false}
            node={node({
                id: 'root',
            })}
            onSelect={noop}
            onToggle={(id) => toggled.push(id)}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="learn-row"]') as Element);
    
    cleanup();
    
    const expected = ['root'];
    const result = toggled;
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The coarse-pointer case, and the whole of bug 2 on a touchscreen.
 *
 * A coarse pointer fires `click` on `pointerup`, so a row that both selects and
 * folds on one handler folds on the first tap and unfolds on the second — the
 * two effects cancel and the user taps twice and sees nothing happen. The
 * `mobile` prop already existed on `LearnTree`; it never reached the row,
 * because the row was inline markup with one handler.
 *
 * The reasoning is `AstRow`'s, and the case is copied from its spec for the same
 * reason the component copies the handler: two trees drawing the same rows with
 * the same caret should answer a pointer the same way.
 */
test('LearnRow: a coarse pointer selects without toggling', (t) => {
    const toggled: string[] = [];
    const picked: string[] = [];
    
    render(
        <LearnRow
            ancestorLastFlags={[]}
            collapsed={false}
            dimmed={false}
            hasChildren
            last={false}
            matched={false}
            mobile
            node={node({
                id: 'root',
            })}
            onSelect={(id) => picked.push(id)}
            onToggle={(id) => toggled.push(id)}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="learn-row"]') as Element);
    
    cleanup();
    
    const result = {
        picked,
        toggled,
    };
    const expected = {
        picked: ['root'],
        toggled: [],
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A leaf does not fold on a fine pointer either, because it has nothing to
 * fold.
 *
 * `hasChildren &&` is the guard, and without this spec a change that toggled
 * every row would pass the two above and fold leaves into nothing.
 */
test('LearnRow: a leaf does not toggle on a fine click', (t) => {
    const toggled: string[] = [];
    
    render(
        <LearnRow
            ancestorLastFlags={[]}
            collapsed={false}
            dimmed={false}
            hasChildren={false}
            last={false}
            matched={false}
            mobile={false}
            node={node({
                id: 'root/alone',
            })}
            onSelect={noop}
            onToggle={(id) => toggled.push(id)}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="learn-row"]') as Element);
    
    cleanup();
    
    const expected: string[] = [];
    const result = toggled;
    
    t.deepEqual(result, expected);
    t.end();
});

test('LearnRow: carries the learn-row testid', (t) => {
    row();
    
    const result = document.querySelector('[data-testid="learn-row"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnRow: clicking reports the id', (t) => {
    const picked: string[] = [];
    
    render(
        <LearnRow
            ancestorLastFlags={[]}
            collapsed={false}
            dimmed={false}
            hasChildren={false}
            last={false}
            matched={false}
            node={node({
                id: 'root/branch',
            })}
            onSelect={(id) => picked.push(id)}
            onToggle={noop}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="learn-row"]') as Element);
    
    cleanup();
    
    const expected = ['root/branch'];
    const result = picked;
    
    t.deepEqual(result, expected);
    t.end();

/**
 * A concept row shows no position, but it does carry every visual state an AST
 * row carries — the stylesheet is shared (`AstTree.css`), so the class names
 * have to match or a selected learn row would render as an ordinary one.
 */
test('LearnRow: carries the selected class', (t) => {
    render(
        <LearnRow
            ancestorLastFlags={[]}
            collapsed={false}
            dimmed={false}
            hasChildren={false}
            last={false}
            matched={false}
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected
        />,
    );
    
    const element = document.querySelector('[data-testid="learn-row"]');
    const result = Boolean(element && element.classList.contains('ast-row--selected'));
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnRow: carries the dimmed class for an ancestor of a match', (t) => {
    render(
        <LearnRow
            ancestorLastFlags={[]}
            collapsed={false}
            dimmed
            hasChildren
            last={false}
            matched={false}
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const element = document.querySelector('[data-testid="learn-row"]');
    const result = Boolean(element && element.classList.contains('ast-row--dimmed'));
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnRow: carries the match class for a row that matched', (t) => {
    render(
        <LearnRow
            ancestorLastFlags={[]}
            collapsed={false}
            dimmed={false}
            hasChildren={false}
            last={false}
            matched
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const element = document.querySelector('[data-testid="learn-row"]');
    const result = Boolean(element && element.classList.contains('ast-row--match'));
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The caret is `AstRow`'s, and that is the point.
 *
 * The two trees share `caretOf` and `connectorsOf`, so a learn row draws the
 * same `▾` / `▸` / blanks and the same branch markers an AST row does. Sharing
 * them is what keeps the caret meaningful across both — and what makes the
 * missing toggle in bug 2 look like a broken caret rather than a decoration.
 */
test('LearnRow: a container shows the open caret and a leaf none', (t) => {
    row({
        hasChildren: true,
    });
    
    const open = read('.ast-row__caret');
    
    cleanup();
    
    row({
        hasChildren: false,
    });
    
    const leaf = read('.ast-row__caret');
    
    cleanup();
    
    const result = {
        open,
        leaf,
    };
    const expected = {
        open: '▾',
        leaf: '  ',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

});
