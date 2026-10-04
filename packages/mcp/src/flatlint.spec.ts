import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
    runBuild,
    runCheck,
} from './flatlint.ts';

/**
 * The real plugin, from `lib/plugins/remove-useless-assign/index.js`.
 *
 * Copied rather than invented because it is the shape the tool has to accept,
 * and an invented fixture would agree with an invented check.
 */
const REAL = `export const report = () => \`Remove useless '='\`;

export const replace = () => ({
    'import __a = from "__b"': 'import __a from "__b"',
});`;

/**
 * The tool's answer as a string.
 *
 * Named `answer` rather than `result` because most specs here compare an
 * **object** built from the answer against a literal — and a spec that holds the
 * string in `result` and the booleans in `expected` reads as though `result` were
 * the thing under test. That confusion is worth a name.
 */
const answer = async (args: Parameters<typeof handler>[0]) => {
    const result = await handler(args);
    
    return result.content[0].text;
};

test('local flatlint_rule: name is flatlint_rule', (t) => {
    t.equal(name, 'flatlint_rule');
    t.end();
});

test('local flatlint_rule: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local flatlint_rule: schema has the fields the tool reads', (t) => {
    const result = Object
        .keys(schema.shape)
        .sort();
    
    const expected = [
        'action',
        'name',
        'pattern',
        'rule',
        'to',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The real plugin passes, unchanged.
 *
 * The regression that matters: a checker that rejects flatlint's own shipped
 * rule is worse than no checker, and the rule is two exports with a `replace`
 * map and no `match`.
 */
test('local flatlint_rule: accepts the shipped rule unchanged', (t) => {
    const {
        ok,
        hasMatch,
        hasReport,
        hasReplace,
        firstIsReport,
    } = runCheck(REAL);
    
    const expected = {
        firstIsReport: true,
        hasMatch: false,
        hasReplace: true,
        hasReport: true,
        ok: true,
    };
    
    const result = {
        firstIsReport,
        hasMatch,
        hasReplace,
        hasReport,
        ok,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A `match` export is the putout shape, and flatlint ignores it.
 *
 * The check that catches a rule written by muscle memory from putout: it would
 * look right, run, and never fire, because in flatlint the replace KEY is the
 * matcher.
 *
 * Two assertions, because the two facts are different. `hasMatch` is true — the
 * rule **does** carry one — and `ok` is false, which is what the tool reports.
 * A single `t.notOk(hasMatch)` here would have passed for a rule with no `match`
 * at all and been silent about the thing it names.
 */
test('local flatlint_rule: rejects a rule carrying a putout-style match', (t) => {
    const {hasMatch, ok} = runCheck(`${REAL}

export const match = () => ({'a': 'b'});`);
    
    const result = {
        hasMatch,
        ok,
    };
    
    const expected = {
        hasMatch: true,
        ok: false,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local flatlint_rule: rejects a rule with no replace', (t) => {
    const {ok} = runCheck('export const report = () => `x`;');
    
    t.notOk(ok);
    t.end();
});

test('local flatlint_rule: rejects a rule with no report', (t) => {
    const {hasReport} = runCheck('export const replace = () => ({\'a __b\': \'a c\'});');
    
    t.notOk(hasReport);
    t.end();
});

test('local flatlint_rule: a rule that does not parse is reported, not thrown', (t) => {
    const {problem} = runCheck('export const = broken');
    
    t.notOk(problem === null);
    t.end();
});

/**
 * The contract, with no arguments at all.
 *
 * The point of it is the **testing** section, which is the part that is not
 * derivable from a plugin file: `t.transform` is named after the *fixture*, and
 * flatlint swaps only `lint` so every operator is `@putout/test`'s.
 */
test('local flatlint_rule: the contract names the fixture convention', async (t) => {
    const text = await answer({});
    
    const result = {
        // named after the FIXTURE, not the rule — the thing you get wrong first
        fixtureNotRule: text.includes('named after the FIXTURE'),
        noMatch: text.includes('no `match`'),
        reportFirst: text.includes('`report` comes first'),
    };
    
    const expected = {
        fixtureNotRule: true,
        noMatch: true,
        reportFirst: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local flatlint_rule: contract also comes back for action=contract', async (t) => {
    const text = await answer({
        action: 'contract',
    });
    
    t.match(text, 'A flatlint plugin');
    t.end();
});

/**
 * Building from a pattern emits all four files at once.
 *
 * The generated rule, spec, fixture layout and the reminder to `test_pattern`
 * the key first — because a key nothing matches is a rule that is green and
 * silent, which is the one failure mode a scaffold cannot see.
 */
test('local flatlint_rule: builds the rule, the spec and the fixture layout', async (t) => {
    const text = await answer({
        pattern: 'import __a = from "__b"',
        to: 'import __a from "__b"',
    });
    
    const result = {
        fixtureLayout: text.includes('fixture/'),
        hasReplace: text.includes('export const replace'),
        hasRule: text.includes('export const report'),
        hasSpec: text.includes('t.transform('),
        // the check the tool cannot do for the author
        pointsAtTestPattern: text.includes('test_pattern'),
    };
    
    const expected = {
        fixtureLayout: true,
        hasReplace: true,
        hasRule: true,
        hasSpec: true,
        pointsAtTestPattern: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A key with no placeholder can only match that literal.
 *
 * Worth saying out loud because it is legal and looks deliberate: `'a = b'` as
 * a key matches exactly that text and nothing else.
 */
test('local flatlint_rule: warns when the pattern has no placeholder', async (t) => {
    const text = await answer({
        pattern: 'import a from "b"',
    });
    
    t.match(text, 'no `__x` placeholder');
    t.end();
});

/**
 * `__c` is not bound by the pattern grammar, so a key using it matches nothing.
 *
 * The failure is silent — the rule loads, the report says nothing, and no test
 * fails — which is why it is worth a line of output from a scaffold.
 */
test('local flatlint_rule: warns about an unbound placeholder', async (t) => {
    const text = await answer({
        pattern: 'import __c from "__b"',
    });
    
    t.match(text, 'is not bound by the pattern grammar');
    t.end();
});

/**
 * And says so when there is no replacement to write yet.
 *
 * The scaffold emits a `the fixed source` placeholder where the replacement
 * goes. It is valid and useless, so the output has to say that rather than let
 * it be pasted.
 */
test('local flatlint_rule: says the replacement is still to be written', async (t) => {
    const text = await answer({
        pattern: 'import __a from "__b"',
    });
    
    t.match(text, 'the replacement is a placeholder');
    t.end();
});

/**
 * The derived rule name, and that an explicit one wins.
 *
 * `kebab`-cased off the key and capped, because a key is not a name: `import
 * __a from "__b"` would be a directory called `import-a-from-b`.
 */
test('local flatlint_rule: derives a directory name from the key', (t) => {
    const {placeholders, ruleName} = runBuild('import __a from "__b"');
    
    const result = {
        placeholders,
        ruleName,
    };
    
    const expected = {
        placeholders: ['a', 'b'],
        ruleName: 'import-a-from-b',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A key with nothing nameable in it.
 *
 * `kebab` strips every non-alphanumeric, so a key made only of them derives the
 * **empty string** — and `lib/plugins//` is not a directory. The `my-rule`
 * fallback is the arm that stops a scaffold emitting a path that cannot exist.
 *
 * `'__a'` is the near-miss and it is why this is a spec: `kebab('__a')` is
 * `'a'`, a perfectly good directory name, so the obvious input does **not**
 * reach the fallback at all.
 */
test('local flatlint_rule: falls back to a usable name when the key has none', (t) => {
    const {hasPlaceholder, ruleName} = runBuild('__');
    
    const result = {
        hasPlaceholder,
        ruleName,
    };
    
    const expected = {
        hasPlaceholder: false,
        ruleName: 'my-rule',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The near-miss, pinned so the fallback is not moved by accident.
 *
 * `'__a'` keeps its `a`: the leading `__` is stripped as punctuation and what is
 * left is nameable. A rule called `a` is silly but valid; `my-rule` would be the
 * wrong answer here.
 */
test('local flatlint_rule: a placeholder-only key still derives a name', (t) => {
    const {hasPlaceholder, ruleName} = runBuild('__a');
    
    const result = {
        hasPlaceholder,
        ruleName,
    };
    
    const expected = {
        hasPlaceholder: true,
        ruleName: 'a',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The reporting branches, reached **through the handler**.
 *
 * `runCheck` pins the analysis; these pin the words, because the tool's whole
 * output is the report and a line that never runs is a message a reader never
 * gets. Each case is the one input that flips one condition.
 */
test('local flatlint_rule: accepts a rule through the handler', async (t) => {
    const text = await answer({
        rule: REAL,
    });
    
    const result = {
        // `__a` twice and `__b` twice in the real rule
        countedPlaceholders: text.includes('__ placeholders: 4'),
        ok: text.includes('✓ report first'),
    };
    
    const expected = {
        countedPlaceholders: true,
        ok: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Every complaint at once — the input that should produce the longest report.
 *
 * `replace` first (so the ordering note fires), a `match` (which flatlint
 * ignores), and no `report` at all. A rule with all three is exactly what
 * putout muscle memory produces, and all of it is said in one pass. The missing
 * `replace` is a separate input, in the `runCheck` spec above.
 */
test('local flatlint_rule: reports every problem at once', async (t) => {
    const text = await answer({
        rule: `export const replace = () => ({'a __b': 'a c'});

export const match = () => ({'a __b': 'a c'});`,
    });
    
    const result = {
        notOk: !text.includes('✓'),
        saysNoReport: text.includes('no `report` export'),
        saysPutoutMatch: text.includes('a `match` export'),
        saysOrder: text.includes('not `report`'),
    };
    
    const expected = {
        notOk: true,
        saysNoReport: true,
        saysPutoutMatch: true,
        saysOrder: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A rule with nothing in it at all.
 *
 * `exports: (none)` is the arm that catches someone pasting the wrong half of a
 * file, and it is the one a reader is least able to interpret unaided.
 */
test('local flatlint_rule: says "(none)" for a rule with no exports', async (t) => {
    const text = await answer({
        rule: 'const x = 1;',
    });
    
    t.match(text, 'exports: (none)');
    t.end();
});

/**
 * A rule that does not parse, through the **handler**.
 *
 * The `runCheck` spec covers the analysis; this covers the one place a tool can
 * still crash the session — the early return that short-circuits before any
 * report is built. `tryToCatch` makes the throw unreachable, but "unreachable"
 * is a claim about the code, and this is the user-visible half of it.
 */
test('local flatlint_rule: a rule that does not parse answers, through the handler', async (t) => {
    const text = await answer({
        rule: 'export const = broken',
    });
    
    t.match(text, '✗ does not parse');
    t.end();
});
