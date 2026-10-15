import {test} from 'supertape';
import {print} from '../lib/printer.ts';

/**
 * The five cases step 7 of the plan pins, as text — not as `Block[]`.
 *
 * Asserting the text is the point: `buildCFG` returns blocks for the React
 * component and the plugin, but the printer's own contract is the format —
 * headers, indentation, `[true]`/`[false]`, `[unreachable]` — and a spec that
 * parsed the output back would be asserting the parser's half of the
 * round-trip from the printer's suite.
 */
test('printer: empty function body single block no stmts', (t) => {
    const result = print('function f() {}');
    const expected = [
        'block 0',
        '  -> exit',
    ].join('\n');

    t.equal(result, expected);
    t.end();
});

test('printer: return only — block 0 with exit edge', (t) => {
    const result = print('function f() { return a; }');
    const expected = [
        'block 0',
        '  return a;',
        '  -> exit',
    ].join('\n');

    t.equal(result, expected);
    t.end();
});

test('printer: if else — three blocks correct edges', (t) => {
    const result = print('function f() { if (a) b(); else c(); }');
    const expected = [
        'block 0',
        '  a ?',
        '  -> 1 [true]',
        '  -> 2 [false]',
        '',
        'block 1',
        '  b();',
        '  -> 3',
        '',
        'block 2',
        '  c();',
        '  -> 3',
        '',
        'block 3',
        '  -> exit',
    ].join('\n');

    t.equal(result, expected);
    t.end();
});

test('printer: return mid-block — unreachable next block', (t) => {
    const result = print('function f() { return a; b(); }');
    const expected = [
        'block 0',
        '  return a;',
        '  -> exit',
        '',
        'block 1 [unreachable]',
        '  b();',
    ].join('\n');

    t.equal(result, expected);
    t.end();
});

test('printer: duplicate else branches — two identical blocks', (t) => {
    const result = print('function f() { if (a) b(); else b(); }');
    const expected = [
        'block 0',
        '  a ?',
        '  -> 1 [true]',
        '  -> 2 [false]',
        '',
        'block 1',
        '  b();',
        '  -> 3',
        '',
        'block 2',
        '  b();',
        '  -> 3',
        '',
        'block 3',
        '  -> exit',
    ].join('\n');

    t.equal(result, expected);
    t.end();
});
