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
 * The shape under test, spelled out once.
 *
 * `block N` on a line, `  stmt` indented under it, `  -> N [label]` for an edge.
 * Blank lines separate blocks. `[unreachable]` on the header is the printer's
 * own annotation, and `terminal` says the block ends in `-> exit` with a
 * `return` in it — the printer writes the first, and this infers the second.
 *
 * This is the **inverse** of `printer.ts`, and the pair is the contract: a
 * `Block[]` prints to text and the text parses back to the same `Block[]`.
 * `index.spec.ts` asserts that round-trip, which is why both files exist
 * separately and are never merged.
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
 * A header that is not `block N` is not a block.
 *
 * The `continue` in the header check, and it is not hypothetical: `parse`'s
 * caller may hand it any text a user pasted, and a paragraph with no header
 * must come back as no blocks rather than as one with `NaN` for an id. The
 * blank line below also exercises the split's whitespace tolerance —
 * `\n\s*\n` — which the ordinary two-block fixtures reach but this one
 * reaches without a second header to hide the trim behind.
 */
test('parser: a chunk without a block header is skipped', (t) => {
    const result = parse('just a paragraph\n\n  and its indented line');
    const expected: Block[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A label the printer never writes — an edge kept rather than dropped when
 * the format's `[word]` does not read.
 *
 * The `|| []` fallback of the match, which no `-> 1 [true]` fixture can
 * reach: those always match. Foreign text is not hypothetical here, since
 * `buildCFG` parses whatever text `print` produced and `parse` is exported
 * for the same reason `parser.ts` is its own file — it must answer about
 * text it did not write rather than throw on it.
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
 * `terminal` is inferred, never parsed: a block that reaches `exit` **and**
 * holds a `return` cannot fall through, so the merge point after it is dead.
 *
 * The `&&` is the whole rule and both halves are load-bearing. An `exit` edge
 * with no `return` is a block that ends in a `throw`, which does not terminate
 * a merge the same way; and a `return` whose edge is somewhere else is a
 * `return` the printer has not split out. Marking either `terminal` would make
 * `findUnreachable` claim a live block.
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
