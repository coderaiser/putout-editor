import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
    fireEvent,
} from '@testing-library/react';
import type {
    FlatLearnNode,
    LearnNode,
} from '@putout/editor-commands';
import {flattenLearn} from '@putout/editor-commands';
import LearnTree from './LearnTree.tsx';

/**
 * The rows are built by `flattenLearn` from a real `LearnNode` tree rather than
 * hand-written, for the reason `AstBlock.spec.tsx` gives: a hand-written
 * `FlatLearnNode[]` agrees with the component only because the same author wrote
 * both. This way a change to `flattenLearn` breaks this spec instead of passing
 * it.
 *
 *     root
 *     - branch
 *       - leaf
 *     - alone
 */
const tree: LearnNode[] = [{
    id: 'root',
    label: 'root',
    summary: 'the top',
    body: 'top body',
    children: [{
        id: 'root/branch',
        label: 'branch',
        summary: 'a branch',
        body: 'branch body',
        children: [{
            id: 'root/branch/leaf',
            label: 'leaf',
            summary: 'a leaf',
            body: 'leaf body',
            example: 'const a = 1;\n',
        }],
    }, {
        id: 'root/alone',
        label: 'alone',
        summary: 'on its own',
        body: 'alone body',
        example: 'const b = 2;\n',
    }],
}];

const noop = () => {};

const mount = (onOpen: (node: FlatLearnNode) => void = noop, mobile?: boolean) => render(
    <LearnTree
        mobile={mobile}
        nodes={flattenLearn(tree)}
        onOpen={onOpen}
    />,
);

const rows = () => [
    ...document.querySelectorAll('[data-testid="learn-row"]'),
];

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

const press = (key: string) => {
    const output = document.querySelector('[data-testid="learn-output"]') as HTMLElement;
    
    act(() => {
        fireEvent.keyDown(output, {
            key,
        });
    });
};

test('LearnTree: renders the learn-output testid', (t) => {
    mount();
    
    const result = document.querySelector('[data-testid="learn-output"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnTree: shows the root label in a row', (t) => {
    mount();
    
    const result = rows()[0].textContent;
    const expected = '▾rootthe top';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * `collapsedDepth: 0`, the one difference from `AstTree` that is a number.
 *
 * The AST tree draws two rows because its depth-1 rows are folded. A concept
 * tree's first level *is* the table of contents — `ast`, `plugins`, `patterns`,
 * `plugin-types` — so folding it would hide the whole point of the command. The
 * root is open and its sections are drawn but closed: a collapsed row still
 * shows, only its children are hidden.
 */
test('LearnTree: opens the root and draws its sections closed', (t) => {
    mount();
    
    const result = rows().map((row) => row.textContent);
    const expected = [
        '▾rootthe top',
        '├─ ▸brancha branch',
        '└─   aloneon its own',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/** A folded section is reachable, which is what a caret is for. */
test('LearnTree: expanding a section shows its children', (t) => {
    mount();
    
    press('ArrowDown');
    press('ArrowRight');
    
    const result = rows().map((row) => row.textContent);
    const expected = [
        '▾rootthe top',
        '├─ ▸brancha branch',
        '└─   aloneon its own',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/** A leaf carries its example, so the row is the thing `[try it →]` needs. */
test('LearnTree: a section has a caret and a leaf has none', (t) => {
    mount();
    
    press('ArrowDown');
    press('ArrowRight');
    
    press('ArrowDown');
    
    press('ArrowRight');
    
    const result = rows().map((row) => row.querySelector('.ast-row__caret')?.textContent);
    const expected = ['▾', '▸', '  '];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `Enter` on a leaf reports it, which is the tree's one action.
 *
 * Driven through a keypress rather than by calling `onOpen`: the contract is
 * that a key in the page reaches the callback, and calling it directly would
 * pass a test that asserts nothing about the keyboard.
 */
test('LearnTree: enter on a leaf calls onOpen with it', (t) => {
    const opened: string[] = [];
    
    mount((node) => opened.push(node.id));
    
    // `rows()[2]` is the leaf: root, branch, then alone.
    fireEvent.click(rows()[2]);
    press('Enter');
    
    const result = opened;
    const expected = ['root/alone'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `Enter` on a container expands it instead.
 *
 * The other half of the branch in `useTreeState`, and the half that keeps plain
 * keyboard use working when `LearnBlock`'s `learnOpen` is the only thing being
 * tested: a section that opened rather than expanding would trap the user above
 * it.
 */
test('LearnTree: enter on a section toggles it instead of opening', (t) => {
    const opened: string[] = [];
    
    mount((node) => opened.push(node.id));
    
    // The root is open, so toggling it folds everything below it away.
    fireEvent.click(rows()[0]);
    press('Enter');
    
    const result = {
        opened,
        rows: rows().length,
    };
    const expected = {
        opened: [],
        rows: 1,
    };
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The filter reaches a leaf by its summary, not only by its label.
 *
 * Asserted on the summary because the label is what every search would find: a
 * curriculum whose rows are only searchable by label is a tree whose one-line
 * descriptions are invisible to the one tool that reads them.
 */
test('LearnTree: filters by summary as well as by label', (t) => {
    mount();
    
    const output = document.querySelector('[data-testid="learn-output"]') as HTMLElement;
    
    act(() => {
        fireEvent.keyDown(output, {
            key: '/',
        });
    });
    
    const search = document.querySelector('[data-testid="ast-search"]') as HTMLElement;
    
    act(() => {
        fireEvent.change(search, {
            target: {
                value: 'on its own',
            },
        });
    });
    
    const result = rows().map((row) => row.textContent);
    const expected = [
        '▾rootthe top',
        '└─   aloneon its own',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The status bar names the selected row.
 *
 * `AstTree` shows a type and a position there. A concept has neither, so
 * `LearnTree` shows the label — and a dash before anything is selected, which is
 * what the bare `-- hidden` bar reads as without it.
 */
test('LearnTree: the status bar shows the selected label', (t) => {
    mount();
    
    press('ArrowDown');
    press('ArrowDown');
    press('ArrowDown');
    
    const result = read('.ast-status__type');
    const expected = 'alone';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnTree: the status bar shows a dash with no selection', (t) => {
    mount();
    
    const result = read('.ast-status__type');
    const expected = '—';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnTree: the status bar teaches the open key', (t) => {
    mount();
    
    const result = read('.ast-status__help');
    const expected = '↑↓/jk navigate · space/enter open · / search · tab switch';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('LearnTree: the status bar shortens its hint on a coarse pointer', (t) => {
    mount(noop, true);
    
    const result = read('.ast-status__help');
    const expected = '↑↓ · enter · /';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * Clicking a row selects it, which is what makes the tree usable without the
 * keyboard — and what `fireEvent.click` needs for the enter specs above.
 *
 * Asserted separately because open-on-enter depends on it: a test that
 * `press('Enter')` after a click would pass on an e2e and fail here if the
 * click never selected.
 */
test('LearnTree: clicking a row shows it in the status bar', (t) => {
    mount();
    
    fireEvent.click(rows()[1]);
    
    const result = read('.ast-status__type');
    const expected = 'branch';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
