import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import type {FlatNode} from '@putout/editor-commands';
import AstStatus, {hintOf} from './AstStatus.tsx';

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

const node = (over: Partial<FlatNode> = {}): FlatNode => ({
    id: '0',
    pid: null,
    depth: 0,
    type: 'BinaryExpression',
    detail: '',
    line: 2,
    col: 9,
    endLine: 2,
    endCol: 14,
    ...over,
});

const status = (selected: FlatNode | null, hidden = 0, mobile?: boolean) => render(
    <AstStatus
        hidden={hidden}
        mobile={mobile}
        selected={selected}
    />,
);

test('AstStatus: shows the selected type', (t) => {
    status(node());
    
    const result = read('.ast-status__type');
    const expected = 'BinaryExpression';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows the start and end positions', (t) => {
    status(node());
    
    const result = read('.ast-status__pos');
    const expected = 'start 2:9   end 2:14';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows a dash for the type when nothing is selected', (t) => {
    status(null);
    
    const result = read('.ast-status__type');
    const expected = '—';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows a dash for the position when nothing is selected', (t) => {
    status(null);
    
    const result = read('.ast-status__pos');
    const expected = '—';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows the hidden count when rows are collapsed', (t) => {
    status(node(), 3);
    
    const result = read('.ast-status__hidden');
    const expected = '3 hidden';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: omits the hidden count when nothing is collapsed', (t) => {
    status(node(), 0);
    
    const result = document.querySelector('.ast-status__hidden');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: carries the status testid', (t) => {
    status(null);
    
    const result = document.querySelector('[data-testid="ast-status"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows the key hints', (t) => {
    status(null);
    
    const result = read('.ast-status__help');
    const expected = '↑↓/jk navigate · h/l fold/expand · space/enter expand · / search · tab switch';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The full hint names `h/l`, which did not exist when the string was written.
 *
 * Asserted as its own case rather than folded into the one above: the string is
 * the only place the bindings are *documented*, so a spec that checked "some
 * hint is rendered" would pass on a page that taught the user four of the six
 * keys it actually binds.
 */
test('AstStatus: the full hint names the h/l bindings', (t) => {
    status(null);
    
    const result = read('.ast-status__help');
    const expected = 'h/l fold/expand';
    
    cleanup();
    
    t.ok(result && result.includes(expected));
    t.end();
});

/**
 * `mobile` picks the short hint.
 *
 * The full hint is 62 characters and wraps to four lines on a 390px screen,
 * which is most of a phone's composer. What survives is the three gestures that
 * have a touch equivalent at all — the arrow keys, space, and `/`.
 */
test('AstStatus: shows the short hint on a coarse pointer', (t) => {
    status(null, 0, true);
    
    const result = read('.ast-status__help');
    const expected = '↑↓ · space · /';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: the short hint drops the keyboard-only bindings', (t) => {
    status(null, 0, true);
    
    const result = read('.ast-status__help');
    const expected = {
        // a 44px-tall hint bar cannot carry a vim cheat sheet
        hasKeyboardOnly: result && result.includes('jk'),
        hasTab: result && result.includes('tab'),
    };
    
    cleanup();
    
    t.deepEqual(expected, {
        hasKeyboardOnly: false,
        hasTab: false,
    });
    t.end();
});

/**
 * `hintOf` directly, because the prop is optional and `undefined` is a real
 * value the component has to render correctly.
 *
 * `AstTree` declares `mobile?: boolean` so it can be mounted without the caller
 * knowing about pointers; the default has to be the *desktop* hint, not the
 * short one, or every existing mount silently loses its documentation.
 */
test('AstStatus: hintOf defaults to the full hint when mobile is undefined', (t) => {
    const result = hintOf(undefined);
    const expected = '↑↓/jk navigate · h/l fold/expand · space/enter expand · / search · tab switch';
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: hintOf switches both ways', (t) => {
    const result = {
        coarse: hintOf(true),
        fine: hintOf(false),
    };
    
    const expected = {
        coarse: '↑↓ · space · /',
        fine: '↑↓/jk navigate · h/l fold/expand · space/enter expand · / search · tab switch',
    };
    
    t.deepEqual(result, expected);
    t.end();
});
