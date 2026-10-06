import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
    runCheck,
} from './visitor.ts';

/**
 * The two real visitors, copied from the two shipped processors.
 *
 * `happy-mark`'s `string-literal.js` and `happy-style`'s `rule.js`, because a
 * checker that rejects the shipped code is worse than no checker — and because
 * they are the *smallest* complete example of each shape: a one-line leaf and a
 * structural one.
 */
const LEAF = `export const StringLiteral = (path, {write}) => {
    write(path.node.value);
};`;

const STRUCTURAL = `export function rule(path, {write, traverse, indent}) {
    const [selectorArg, declarationsArg] = path.get('arguments');
    
    indent();
    traverse(selectorArg);
    write(' {\\n');
    indent.inc();
    
    for (const decl of declarationsArg.get('elements'))
        traverse(decl);
    
    indent.dec();
    indent();
    write('}\\n');
}`;

const text = async (args: Parameters<typeof handler>[0]) => {
    const result = await handler(args);
    
    return result.content[0].text;
};

test('local printer_visitor: name is printer_visitor', (t) => {
    t.equal(name, 'printer_visitor');
    t.end();
});

test('local printer_visitor: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local printer_visitor: schema has action, visitor and type', (t) => {
    const result = Object
        .keys(schema.shape)
        .sort();
    const expected = [
        'action',
        'type',
        'visitor',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Both shipped visitors pass, unchanged.
 *
 * One destructures `write`; the other destructures `write`, `traverse` and
 * `indent`. Both are named for a real babel node type, and both write. If this
 * ever fails, the API list has drifted from `printer.js`.
 */
test('local printer_visitor: accepts the shipped visitors unchanged', (t) => {
    const leaf = runCheck(LEAF, 'StringLiteral');
    const structural = runCheck(STRUCTURAL);
    
    const result = {
        leaf: leaf.ok,
        leafName: leaf.nameMatchesType,
        structural: structural.ok,
    };
    
    const expected = {
        leaf: true,
        leafName: true,
        structural: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * An invented api key is the finding worth making.
 *
 * `format` reads like something the printer has — and `createPrinter` really
 * does destructure a `format` — but it is **not** in the object handed to a
 * visitor, so a visitor asking for it gets `undefined` and then a `TypeError`
 * halfway through a print.
 */
test('local printer_visitor: flags an api key the printer does not provide', (t) => {
    const result = runCheck('export const CallExpression = (path, {format, write}) => {\n    write(format);\n};');
    
    // `t.match` is for strings, so an array membership is a deepEqual
    t.deepEqual(result.unknownApi, ['format']);
    t.end();
});

/**
 * The export name is the dispatch key.
 *
 * `{...baseVisitors, ...visitors}` is looked up by node type, so a visitor named
 * for something else is not "nearly right" — it is **never called**, and the
 * base printer handles the node as if the visitor did not exist.
 */
test('local printer_visitor: flags an export that is not a node type', (t) => {
    const result = runCheck('export const myFavourite = (path, {write}) => {\n    write(path.node.value);\n};');
    
    t.deepEqual(result.unknownExport, ['myFavourite']);
    t.end();
});

/**
 * And a mismatch against the declared `type`, which is the other half of the
 * same mistake and the one that is invisible in the source.
 */
test('local printer_visitor: flags an export that does not match the declared type', async (t) => {
    const result = await text({
        type: 'CallExpression',
        visitor: 'export const CallExpression2 = (path, {write}) => {\n    write(1);\n};',
    });
    
    t.match(result, 'does not match');
    t.end();
});

/**
 * A visitor that writes nothing is silent.
 *
 * The printer inspects nothing a visitor returns, so a visitor with no `write`
 * produces output missing a token and no error anywhere. That is why the check
 * counts `write(` rather than trusting the shape.
 */
test('local printer_visitor: flags a visitor that never writes', (t) => {
    const result = runCheck('export const StringLiteral = (path, {write}) => {\n    const {value} = path.node;\n};');
    
    t.equal(result.writes, 0);
    t.end();
});

test('local printer_visitor: a visitor that does not parse is reported, not thrown', async (t) => {
    const result = await text({
        visitor: 'export const = broken',
    });
    
    t.match(result, 'does not parse');
    t.end();
});

/**
 * The contract, and the part of it that is not derivable from a visitor file:
 * the api is a *transcribed spread*, and the two traps are the ones that cost a
 * debugging session each.
 */
test('local printer_visitor: the contract lists the api and both traps', async (t) => {
    const answer = await text({});
    
    const result = {
        overrides: answer.includes('{...baseVisitors, ...visitors}'),
        throwOnUnknown: answer.includes('not supported yet by @putout/printer'),
        writeOnly: answer.includes('ONLY way to emit'),
    };
    
    const expected = {
        overrides: true,
        throwOnUnknown: true,
        writeOnly: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('local printer_visitor: contract also comes back for action=contract', async (t) => {
    const result = await text({
        action: 'contract',
    });
    
    t.match(result, 'A @putout/printer visitor');
    t.end();
});

/**
 * The two-file shape, because recognising a construct and printing it are two
 * different questions, and `path.node.callee.name` is the trick that makes the
 * recogniser one line.
 */
test('local printer_visitor: the contract shows the is* recogniser', async (t) => {
    const result = await text({});
    
    t.match(result, 'path.node.callee.name IS the construct name');
    t.end();
});

test('local printer_visitor: reports a clean visitor as ok', async (t) => {
    const result = await text({
        type: 'StringLiteral',
        visitor: LEAF,
    });
    
    t.match(result, '✓');
    t.end();
});

/**
 * The reporting branches, reached **through the handler**.
 *
 * The `runCheck` specs above pin the analysis; these pin the words, because the
 * tool's whole output is the report and a line that never runs is a message a
 * reader never gets. Each case is the one input that flips one condition.
 */

/**
 * A visitor with no exports and no destructured api.
 *
 * `|| '(none)'` on both template lines — the arm a reader hits when they paste
 * a snippet with no `export` in it, which is the most likely way to use this.
 */
test('local printer_visitor: says "(none)" for a snippet with no exports', async (t) => {
    const answer = await text({
        visitor: 'const visitor = (path, api) => {\n    api.write(path.node.value);\n};',
    });
    
    const result = {
        noApi: answer.includes('api destructured: (none)'),
        noExports: answer.includes('exports: (none)'),
    };
    
    const expected = {
        noApi: true,
        noExports: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The `writes === 0` arm, through the handler.
 *
 * The case that matters most and reads least alarming in the source: the visitor
 * parses, the name is right, the api keys are real — and it prints nothing.
 */
test('local printer_visitor: warns about a visitor that never writes, through the handler', async (t) => {
    const result = await text({
        visitor: 'export const StringLiteral = (path, {write}) => {\n    const {value} = path.node;\n};',
    });
    
    t.match(result, 'no `write(` call at all');
    t.end();
});

/**
 * The "new node type" line, through the handler — a `?` rather than a `✗`.
 *
 * The distinction is deliberate: an export that is not a babel node type is
 * legitimate for a *processor* (a language may want its own), but the printer
 * will throw on it until `@putout/printer` learns it. So it is a question, not
 * a failure.
 */
test('local printer_visitor: raises a question for a node type the printer lacks', async (t) => {
    const result = await text({
        visitor: 'export const Widget = (path, {write}) => {\n    write(path.node.value);\n};',
    });
    
    t.match(result, 'not a babel node type');
    t.end();
});

/**
 * An invented api key, through the **handler**.
 *
 * The `runCheck` spec asserts `unknownApi` contains `format`; this asserts the
 * message that a reader actually gets, including the consequence — the key is
 * `undefined` at print time, which is a `TypeError` halfway through a print
 * rather than a mistake at the top of it.
 */
test('local visitor_visitor: the invented api key is named, through the handler', async (t) => {
    const answer = await text({
        visitor: 'export const CallExpression = (path, {format, write}) => {\n    write(format);\n};',
    });
    
    const result = {
        namesIt: answer.includes('not in the printer API: format'),
        saysConsequence: answer.includes('undefined at print time'),
    };
    
    const expected = {
        namesIt: true,
        saysConsequence: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});
