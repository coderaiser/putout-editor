import {test} from 'supertape';
import {montag} from 'montag';
import {parse, type Block} from '../lib/parser.ts';

const block = (over: Partial<Block> = {}): Block => ({
    id: 0,
    stmts: [],
    succs: [],
    ...over,
});

/**
 * The format: `block N` header, `  stmt` lines, `  -> N [label]` edges,
 * blank lines between blocks. `[unreachable]` comes from the printer.
 * `terminal` is inferred. `index.spec.ts` checks the round-trip.
 */
const source = montag`
    block 0
      let a = 1
      x > 0 ?
      -> 1 [true]
      -> 2 [false]
    
    block 1
      return a
      -> exit
`;

test('parser: empty string returns empty array', (t) => {
    const result = parse('');
    const expected: Block[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: whitespace only is an empty array', (t) => {
    const result = parse('\n\n   \n');
    const expected: Block[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: single block no stmts no edges', (t) => {
    const result = parse('block 0');
    const expected = [
        block(),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Text with no `block N` header gives no blocks, not a block with id `NaN`.
 * A user can paste any text. The blank line also tests the `\n\s*\n` split.
 */
test('parser: a chunk without a block header is skipped', (t) => {
    const result = parse('just a paragraph\n\n  and its indented line');
    const expected: Block[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * An edge label that does not parse keeps the edge. This reaches the
 * `|| []` fallback: `parse` must accept text that `print` did not write.
 */
test('parser: an edge label that does not parse keeps the edge', (t) => {
    const result = parse(montag`
        block 0
          -> 1 [not a word]
    `);
    
    const expected = [
        block({
            succs: [{
                id: 1,
                label: 'not a word',
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: block with stmts', (t) => {
    const result = parse(montag`
        block 0
          let a = 1
          doWork()
    `);
    
    const expected = [
        block({
            stmts: [
                'let a = 1',
                'doWork()',
            ],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: block with plain edge', (t) => {
    const result = parse(montag`
        block 0
          doWork()
          -> 1
    `);
    
    const expected = [
        block({
            stmts: ['doWork()'],
            succs: [{
                id: 1,
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: block with labeled edges true false', (t) => {
    const result = parse(montag`
        block 0
          x > 0 ?
          -> 1 [true]
          -> 2 [false]
    `);
    
    const expected = [
        block({
            stmts: ['x > 0 ?'],
            succs: [{
                id: 1,
                label: 'true',
            }, {
                id: 2,
                label: 'false',
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * `terminal` needs both: an edge to `exit` and a `return`. A `throw` also
 * goes to `exit`. With only one of the two, `findUnreachable` would report a
 * live block.
 */
test('parser: terminal true when block ends with exit and has return stmt', (t) => {
    const result = parse('block 0\n  return a\n  -> exit');
    
    const expected = [
        block({
            stmts: ['return a'],
            succs: [{
                id: 'exit',
            }],
            terminal: true,
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: an exit edge without a return is not terminal', (t) => {
    const result = parse(montag`
        block 0
          throw err
          -> exit
    `);
    
    const expected = [
        block({
            stmts: ['throw err'],
            succs: [{
                id: 'exit',
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: a return with no exit edge is not terminal', (t) => {
    const result = parse(montag`
        block 0
          return a
          -> 1
    `);
    
    const expected = [
        block({
            stmts: ['return a'],
            succs: [{
                id: 1,
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: multiple blocks separated by blank lines', (t) => {
    const result = parse(source);
    
    const expected = [
        block({
            stmts: [
                'let a = 1',
                'x > 0 ?',
            ],
            succs: [{
                id: 1,
                label: 'true',
            }, {
                id: 2,
                label: 'false',
            }],
        }),
        block({
            id: 1,
            stmts: ['return a'],
            succs: [{
                id: 'exit',
            }],
            terminal: true,
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Block ids come from the header, not from position.
 *
 * A printer that emits ids out of order — or a parser that numbered them as it
 * went — would produce a graph whose edges point at the wrong blocks, and every
 * edge is an id. Asserting the id explicitly is what makes the edge target
 * meaningful rather than incidentally correct.
 */
test('parser: the id comes from the header, not from position', (t) => {
    const result = parse(montag`
        block 7
          -> 9
    `);
    
    const expected = [
        block({
            id: 7,
            succs: [{
                id: 9,
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * An indented `->` is an edge and any other indented line is a statement, which
 * is the one ambiguity in the format. `->` is a prefix test on the **indented**
 * line, so a statement can hold an arrow and still be a statement.
 */
test('parser: a statement is any indented line that is not an edge', (t) => {
    const result = parse(montag`
        block 0
          const f = () => 1
          -> 1
    `);
    
    const expected = [
        block({
            stmts: ['const f = () => 1'],
            succs: [{
                id: 1,
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: edge to exit', (t) => {
    const result = parse(montag`
        block 0
          -> exit
    `);
    
    const expected = [
        block({
            succs: [{
                id: 'exit',
            }],
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: unreachable flag on header', (t) => {
    const result = parse(montag`
        block 0
          return a
          -> exit
        
        block 1 [unreachable]
          console.log(a)
    `);
    
    const expected = [
        block({
            stmts: ['return a'],
            succs: [{
                id: 'exit',
            }],
            terminal: true,
        }),
        block({
            id: 1,
            stmts: ['console.log(a)'],
            unreachable: true,
        }),
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * An indented `-> ...` line the edge grammar cannot read (`two words` is not a
 * block id). The printer never writes one, so this is the reader's behavior on
 * foreign text: it keeps the block and the edge rather than throwing, and the
 * id is `NaN` because nothing in the line is a number.
 */
test('parse: an unreadable edge line does not throw', (t) => {
    const [first] = parse('block 0\n  -> two words');
    
    const result = first.succs.length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});
