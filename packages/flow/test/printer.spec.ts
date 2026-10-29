import {test} from 'supertape';
import {montag} from 'montag';
import {print} from '../lib/printer.ts';

/**
 * The printer contract is the text format, so these specs compare text, not
 * `Block[]`. Parsing the output back would test the parser.
 */
test('printer: empty function body single block no stmts', (t) => {
    const result = print('function f() {}');
    const expected = montag`
        block 0
          -> exit
    `;
    
    t.equal(result, expected);
    t.end();
});

test('printer: return only — block 0 with exit edge', (t) => {
    const result = print('function f() { return a; }');
    const expected = montag`
        block 0
          return a;
          -> exit
    `;
    
    t.equal(result, expected);
    t.end();
});

test('printer: if else — three blocks correct edges', (t) => {
    const result = print('function f() { if (a) b(); else c(); }');
    const expected = montag`
        block 0
          a ?
          -> 1 [true]
          -> 2 [false]
        
        block 1
          b();
          -> 3
        
        block 2
          c();
          -> 3
        
        block 3
          -> exit
    `;
    
    t.equal(result, expected);
    t.end();
});

test('printer: return mid-block — unreachable next block', (t) => {
    const result = print('function f() { return a; b(); }');
    const expected = montag`
        block 0
          return a;
          -> exit
        
        block 1 [unreachable]
          b();
    `;
    
    t.equal(result, expected);
    t.end();
});

test('printer: duplicate else branches — two identical blocks', (t) => {
    const result = print('function f() { if (a) b(); else b(); }');
    const expected = montag`
        block 0
          a ?
          -> 1 [true]
          -> 2 [false]
        
        block 1
          b();
          -> 3
        
        block 2
          b();
          -> 3
        
        block 3
          -> exit
    `;
    
    t.equal(result, expected);
    t.end();
});

test('printer: non-function source graphs program body', (t) => {
    const result = print('const a = 1;');
    
    t.match(result, 'block 0');
    t.end();
});
