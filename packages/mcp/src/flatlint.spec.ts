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
 * rule is worse than no checker. `remove-useless-assign` is the two-export case
 * — `report` and a `replace` map — and it has to stay accepted.
 *
 * It is not the case the false claim got wrong, because it is the one shape that
 * looks the same either way. The 14 plugins that also export a `match` are the
 * ones the claim would have rejected, and they have their own spec below.
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
 * A real plugin that HAS a `match`, and it has to pass.
 *
 * `add-missing-arrow`, from `lib/plugins/add-missing-arrow/index.js` — copied
 * rather than invented because an invented fixture would agree with an invented
 * check. Its key, `'(__args) {'`, is the whole reason this spec exists: it
 * **ends in a brace**, so the regex-and-brace-count reader this check replaced
 * read it as zero replace keys and would have called the plugin broken.
 *
 * This is the regression for the false claim it replaced: the tool used to
 * answer `✗ has a match export … is ignored here`, which would have had an
 * author delete a guard that flatlint does honour.
 */
const WITH_MATCH = `export const report = () => \`Add missing '=>'\`;

export const match = () => ({
    '(__args) {': (vars, path) => !isIdentifier(path.getPrev()),
});

export const replace = () => ({
    '(__args) {': '(__args) => {',
    ') = ({': ') => ({',
});`;

test('local flatlint_rule: accepts a real plugin that has a match', (t) => {
    const {
        deadMatchKeys,
        hasMatch,
        ok,
        unguarded,
    } = runCheck(WITH_MATCH);
    
    const result = {
        deadMatchKeys,
        hasMatch,
        ok,
        unguarded,
    };
    
    const expected = {
        // its one guard covers a key that exists, so nothing is dead
        deadMatchKeys: [],
        hasMatch: true,
        ok: true,
        // `') = ({'` is the key with no guard — the norm, not a defect
        unguarded: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A `match` key that is not a `replace` key is DEAD, and that is the finding.
 *
 * `lib/runner/replacer.js` looks the guard up BY the replace key it is
 * iterating, so a guard under a key nothing replaces is never called and the rule
 * fires on every occurrence the author believed they had excluded. Verified by
 * running flatlint: with the guard returning false, `const a = 1;` still became
 * `const a = 1 = 0;`.
 *
 * The negative is what makes it a test. `hasMatch` is true here for the same
 * reason it is true above, so a check that only counted exports would pass both
 * cases and catch neither.
 */
test('local flatlint_rule: flags a match key that guards no replace key', (t) => {
    const {
        deadMatchKeys,
        hasMatch,
        ok,
    } = runCheck(`export const report = () => 'the message';

export const match = () => ({'let __a;': () => false});

export const replace = () => ({'const __a;': 'const __a = 0;'});`);
    
    const result = {
        deadMatchKeys,
        hasMatch,
        ok,
    };
    
    const expected = {
        deadMatchKeys: ['let __a;'],
        hasMatch: true,
        ok: false,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A `match` written with a **block body** is read, not skipped.
 *
 * Every shipped plugin uses the concise form `() => ({...})`, so this arm is
 * unreachable from real input — which is exactly why it needs a spec: 14 of 33
 * plugins exercise the concise path and nothing would have told us the block
 * path was dead. `export function report()` exists in flatlint
 * (`wrap-assignment-in-parens`), so the block form is legal and reachable.
 *
 * Asserting `ok` alone would pass for a reader that returned nothing at all, so
 * the assertion is on the *keys* — the only proof the body was parsed.
 */
test('local flatlint_rule: reads a match written with a block body', (t) => {
    const {
        deadMatchKeys,
        hasMatch,
        ok,
    } = runCheck(`export const report = () => 'the message';

export const match = function() {
    return {
        'const __a;': () => false,
    };
};

export const replace = () => ({
    'const __a;': 'const __a = 0;',
});`);
    
    const result = {
        // the guard under `const __a;` was found, and it guards a real key
        deadMatchKeys,
        hasMatch,
        ok,
    };
    
    const expected = {
        deadMatchKeys: [],
        hasMatch: true,
        ok: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * A `match` this cannot read is **skipped, not guessed at**.
 *
 * The other three ways an arrow body fails to yield an object — an empty block,
 * a block that returns a non-object, and an `init` that is not a function at
 * all. Each reads as *no keys*, which is the property that matters: a key the
 * reader cannot see must not be invented as a dead guard, because that would
 * report a defect in a perfectly good rule.
 *
 * All three in one source, because one assertion covers the property and three
 * assertions would each cover a line.
 */
test('local flatlint_rule: an unreadable match shape yields no keys', (t) => {
    const {deadMatchKeys, ok} = runCheck(`export const report = () => 'the message';

export const match = 42;

export const replace = () => ({
    'const __a;': 'const __a = 0;',
});`);
    
    const result = {
        deadMatchKeys,
        ok,
    };
    
    const expected = {
        // `match` is not a function shape at all — no keys read, none invented
        deadMatchKeys: [],
        ok: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local flatlint_rule: a match with an empty block body yields no keys', (t) => {
    const {deadMatchKeys, ok} = runCheck(`export const report = () => 'the message';

export const match = () => {};

export const replace = () => ({
    'const __a;': 'const __a = 0;',
});`);
    
    const result = {
        deadMatchKeys,
        ok,
    };
    
    const expected = {
        deadMatchKeys: [],
        ok: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local flatlint_rule: a match returning a non-object yields no keys', (t) => {
    const {deadMatchKeys, ok} = runCheck(`export const report = () => 'the message';

export const match = () => {
    return 42;
};

export const replace = () => ({
    'const __a;': 'const __a = 0;',
});`);
    
    const result = {
        deadMatchKeys,
        ok,
    };
    
    const expected = {
        deadMatchKeys: [],
        ok: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The four ways a key or an export cannot be read, and what each must do.
 *
 * All of them read as **no keys**, never as invented ones. That is the property
 * under test: a guard the reader cannot see is not evidence of a defect, so
 * reporting one would put a false finding on a correct rule. Each is its own
 * source because each hits a different arm of the walk, and one assertion per
 * test because supertape allows exactly one.
 */
const readable = (matchSource: string) => `export const report = () => 'the message';

${matchSource}

export const replace = () => ({
    'const __a;': 'const __a = 0;',
});`;

const noKeys = {
    deadMatchKeys: [],
    ok: true,
};

test('local flatlint_rule: a spread in the match map yields no keys', (t) => {
    const {deadMatchKeys, ok} = runCheck(readable(`export const match = () => ({
    ...base,
    'const __a;': () => false,
});`));
    
    const result = {
        deadMatchKeys,
        ok,
    };
    
    t.deepEqual(result, noKeys);
    t.end();
});

test('local flatlint_rule: a computed match key yields no keys', (t) => {
    const {deadMatchKeys, ok} = runCheck(readable(`export const match = () => ({
    [name]: () => false,
});`));
    
    const result = {
        deadMatchKeys,
        ok,
    };
    
    t.deepEqual(result, noKeys);
    t.end();
});

test('local flatlint_rule: a match with no initializer yields no keys', (t) => {
    const {deadMatchKeys, ok} = runCheck(readable('export let match;'));
    
    const result = {
        deadMatchKeys,
        ok,
    };
    
    t.deepEqual(result, noKeys);
    t.end();
});

test('local flatlint_rule: a match returning a bare identifier yields no keys', (t) => {
    const {deadMatchKeys, ok} = runCheck(readable('export const match = () => base;'));
    
    const result = {
        deadMatchKeys,
        ok,
    };
    
    t.deepEqual(result, noKeys);
    t.end();
});

test('local flatlint_rule: a re-export is skipped rather than dereferenced', (t) => {
    // `ExportNamedDeclaration` with no `declaration` — the null the fixer made
    // a `TypeError`, so the arm that skips it is the whole point of this spec
    const {deadMatchKeys, ok} = runCheck(`export {match};

export const report = () => 'the message';

export const match = () => ({
    'const __a;': () => false,
});

export const replace = () => ({
    'const __a;': 'const __a = 0;',
});`);
    
    const result = {
        deadMatchKeys,
        ok,
    };
    
    t.deepEqual(result, noKeys);
    t.end();
});

/**
 * The success line, for a rule that HAS a guard.
 *
 * `runCheck` is pinned above for both cases; this is the one branch that only
 * the handler reaches, and it is a **ternary**, so the unguarded fixture answers
 * only half of it.
 */
test('local flatlint_rule: says a guard is accounted for when there is one', async (t) => {
    const text = await answer({
        rule: WITH_MATCH,
    });
    
    const result = {
        countedGuards: text.includes('every match key guards a replace key'),
        ok: text.includes('✓'),
    };
    
    const expected = {
        countedGuards: true,
        ok: true,
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
        // `match` is documented as real and optional, not absent — the claim it
        // replaces cost 14 of the 33 shipped plugins their guard
        documentsMatch: text.includes('`match` is OPTIONAL'),
        documentsDeadKey: text.includes('absent from `replace` is DEAD'),
        reportFirst: text.includes('`report` first, as in every rule'),
    };
    
    const expected = {
        documentsDeadKey: true,
        documentsMatch: true,
        fixtureNotRule: true,
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
 * `replace` first (so the ordering note fires), no `report` at all, and a
 * `match` whose key is not in `replace` (so the dead-guard finding fires, and the
 * unguarded note with it). A rule with all of that is what putout muscle memory
 * plus a typo produces, and all of it is said in one pass. The missing `replace`
 * is a separate input, in the `runCheck` spec above.
 */
test('local flatlint_rule: reports every problem at once', async (t) => {
    const text = await answer({
        rule: `export const replace = () => ({'a __b': 'a c'});

export const match = () => ({'x __y': () => false});`,
    });
    
    const result = {
        notOk: !text.includes('✓'),
        saysDeadGuard: text.includes('is not a key in `replace`'),
        saysNoReport: text.includes('no `report` export'),
        saysOrder: text.includes('not `report`'),
        saysUnguarded: text.includes('have no `match` guard'),
    };
    
    const expected = {
        notOk: true,
        saysDeadGuard: true,
        saysNoReport: true,
        saysOrder: true,
        saysUnguarded: true,
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
