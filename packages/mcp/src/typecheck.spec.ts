import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
    runChecker,
} from './typecheck.ts';

/**
 * Two arms, in the dialect the tool actually accepts: **strings**.
 *
 * The shapes are the printer's own, measured rather than read off the source,
 * because `parseTypeNames` is not obvious: a string containing `' -> '` goes
 * through `createTuple`, which splits on spaces and keeps only the **last** token
 * as the type name — so `'-: parentPath -> !CallExpression'` becomes selector
 * `parentPath` against `CallExpression`, negated. The bare `'Identifier'` is what
 * gives the table its successful route; a table of only `-:` clauses is rejected
 * at construction.
 *
 * A `['+', fn]` clause is deliberately absent: `fn` is a live function and
 * cannot arrive over MCP. Asserting the string dialect only means the tool's
 * contract and its tests are about the same thing.
 */
const TABLE = [
    '-: parentPath -> !CallExpression',
    'Identifier',
];

/** Never matches `f(a, b);` — there is no `VariableDeclaration` in it. */
const DEAD = 'VariableDeclaration';

const SOURCE = 'f(a, b);';

const text = async (args: Parameters<typeof handler>[0]) => {
    const result = await handler(args);
    
    return result.content[0].text;
};

test('local type_check: name is type_check', (t) => {
    t.equal(name, 'type_check');
    t.end();
});

test('local type_check: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local type_check: schema has fixture and typeNames fields', (t) => {
    const result = {
        fixture: 'fixture' in schema.shape,
        typeNames: 'typeNames' in schema.shape,
    };
    
    const expected = {
        fixture: true,
        typeNames: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The clause that decided, per index, and how many nodes it claimed.
 *
 * Counted rather than listed, so the assertion is about *which arm* and not about
 * how many nodes the fixture happens to have. The numbers are measured: the guard
 * claims the three nodes whose parent is not a call, and everything else lands on
 * the bare `'Identifier'`.
 */
test('local type_check: counts the nodes each clause claimed', (t) => {
    const hits = runChecker(SOURCE, TABLE);
    
    const result = [...hits.entries()].sort((a, b) => a[0] - b[0]);
    const expected = [
        [0, 3],
        [1, 3],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A clause nothing reaches, and the reason the tool exists.
 *
 * The third clause can never fire on this fixture, so it must be **absent** from
 * the map. Asserted on `has` and not on a count: `hits.get(2) || 0` reads the same
 * as "never fired", and that is the whole difference between a dead arm reported
 * and a dead arm hidden.
 */
test('local type_check: a clause nothing reaches is absent from the counts', (t) => {
    const hits = runChecker(SOURCE, [
        ...TABLE,
        DEAD,
    ]);
    
    const result = hits.has(2);
    
    t.notOk(result);
    t.end();
});

/**
 * The report names the dead clause, and says so as a failure.
 *
 * `report()` is the printer's own — same code frame, same wording, same exit
 * code — and the exit code is the load-bearing part. A rule whose table has an
 * arm no fixture reaches is a rule with a test that cannot be written, and this
 * is what says so.
 */
test('local type_check: reports an unreachable clause', async (t) => {
    const result = await text({
        fixture: SOURCE,
        typeNames: [
            ...TABLE,
            DEAD,
        ],
    });
    
    const expected = {
        exit: true,
        named: true,
    };
    
    t.deepEqual({
        exit: result.includes('exit code 1'),
        named: result.includes('Uncovered Checkers found at index: 3'),
    }, expected);
    t.end();
});

/**
 * A table where every clause is reached: exit 0 and the printer's own marker.
 *
 * The counterpart, because a tool that always fails is as useless as one that
 * never does.
 */
test('local type_check: a fully covered table exits zero', async (t) => {
    const result = await text({
        fixture: SOURCE,
        typeNames: TABLE,
    });
    
    const expected = {
        covered: true,
        exit: true,
    };
    
    t.deepEqual({
        covered: result.includes('Checkers Covered'),
        exit: result.includes('exit code 0'),
    }, expected);
    t.end();
});

/**
 * The per-node breakdown, which is what a rule author actually reads.
 *
 * Clause numbers are **1-based** in the output because the printer's report
 * says "found at index: 3" for the *third* clause — mixing 0-based counts into
 * the same text as a 1-based report is how a reader ends up looking at the
 * wrong arm.
 */
test('local type_check: lists each clause and how many nodes it claimed', async (t) => {
    const result = await text({
        fixture: SOURCE,
        typeNames: TABLE,
    });
    
    const expected = {
        first: true,
        second: true,
    };
    
    t.deepEqual({
        first: result.includes('clause 1: 3 node(s) — -: parentPath -> !CallExpression'),
        second: result.includes('clause 2: 3 node(s) — Identifier'),
    }, expected);
    t.end();
});

/**
 * A parse error surfaces as a message rather than a stack.
 *
 * The handler is the only thing between a client and an unhandled throw, and
 * every other tool in this server does the same with `tryToCatch` — a tool that
 * crashes the process takes the whole MCP session with it.
 */
test('local type_check: a parse error is reported, not thrown', async (t) => {
    const result = await text({
        fixture: 'const = broken',
        typeNames: TABLE,
    });
    
    t.notOk(result.includes('at run ('));
    t.end();
});

/**
 * A table the checker itself rejects.
 *
 * `createTypeChecker` throws at **construction** when there is no successful
 * route, and its message says exactly why. This asserts the tool surfaces that
 * rather than folding it into an empty report — a user who writes a lone `-:`
 * clause needs to be told, not shown "0 of 1 covered".
 */
test('local type_check: a table with no successful route is rejected', async (t) => {
    const result = await text({
        fixture: SOURCE,
        typeNames: [
            '-: parentPath -> !CallExpression',
        ],
    });
    
    t.match(result, 'missing successful route');
    t.end();
});

/**
 * The plain-string dialect, which is the one a rule author reaches for first.
 *
 * `'Identifier'` means `node.type === 'Identifier'`, and a table of them
 * reports which types the fixture actually contains — the cheapest possible
 * answer to "which of my arms is this".
 */
test('local type_check: a table of plain type names works too', async (t) => {
    const result = await text({
        fixture: 'const a = 1;',
        typeNames: [
            'Identifier',
            'NumericLiteral',
        ],
    });
    
    const expected = {
        identifier: true,
        numeric: true,
    };
    
    t.deepEqual({
        identifier: result.includes('clause 1: 1 node(s) — Identifier'),
        numeric: result.includes('clause 2: 1 node(s) — NumericLiteral'),
    }, expected);
    t.end();
});

/**
 * The report's own location line, which is a **four-field** `at:uri:line:column`.
 *
 * `report()`'s `setLine` splits the coverage key on `:` and does
 * `Number(line) + index + 1`. A key with a filename in it — `type_check.ts` —
 * puts that string where the number goes, and the report prints
 * `mcp:type_check:NaN:0` instead of a line. Both variants shipped in this file's
 * history and neither failed a test, because nothing asserted on the location.
 *
 * The number itself is the point of the assertion: index 2 (the third clause)
 * with line `0` must come back as line **3**.
 */
test('local type_check: the report location is the clause number as a line', async (t) => {
    const result = await text({
        fixture: SOURCE,
        typeNames: [
            ...TABLE,
            DEAD,
        ],
    });
    
    t.match(result, 'mcp:type_check:3:0');
    t.end();
});

