import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './formats.ts';

const parse = () => JSON.parse(handler().content[0].text);

test('local formats: name is \'formats\'', (t) => {
    t.equal(name, 'formats');
    t.end();
});

test('local formats: description points at the client templates', (t) => {
    t.match(description, 'packages/client/src/snippet/templates');
    t.end();
});

test('local formats: takes no arguments', (t) => {
    const result = Object.keys(schema.shape);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local formats: every format has an id', (t) => {
    const result = parse().every(({id}: {id: string;}) => Boolean(id));
    
    t.ok(result);
    t.end();
});

test('local formats: javascript needs no wrapper', (t) => {
    const [javascript] = parse().filter(({id}: {id: string;}) => id === 'javascript');
    const result = javascript.wrapper;
    
    t.notOk(result);
    t.end();
});

test('local formats: markdown is present with its operator', (t) => {
    const [markdown] = parse().filter(({id}: {id: string;}) => id === 'markdown');
    const result = markdown.operator;
    
    t.equal(result, '__markdown');
    t.end();
});

test('local formats: markdown fixture uses the processor wrapper', (t) => {
    const [markdown] = parse().filter(({id}: {id: string;}) => id === 'markdown');
    const result = markdown.fixture.startsWith('__putout_processor_markdown([');
    
    t.ok(result);
    t.end();
});

test('local formats: non-javascript formats all carry an operator', (t) => {
    const result = parse()
        .filter(({id}: {id: string;}) => id !== 'javascript')
        .every(({operator}: {operator: string;}) => Boolean(operator));
    
    t.ok(result);
    t.end();
});

test('local formats: every non-javascript wrapper names its processor', (t) => {
    const result = parse()
        .filter(({id}: {id: string;}) => id !== 'javascript')
        .every(({wrapper}: {wrapper: string;}) => wrapper.startsWith('__putout_processor_'));
    
    t.ok(result);
    t.end();
});

test('local formats: covers every processor the client templates use', (t) => {
    const result = parse()
        .map(({id}: {id: string;}) => id)
        .sort();
    
    const expected = [
        'css',
        'docker',
        'filesystem',
        'ignore',
        'javascript',
        'json',
        'markdown',
        'toml',
        'yaml',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The two formats whose AST is not babel's, and the two that cost the most to
 * reverse-engineer.
 *
 * A `fixture` says what a *file* looks like. It does not say how a **rule** reaches
 * a node inside it, and that is the half that is hard: `happy-style` and `happy-mark`
 * both lower their tree to JS *call expressions*, so there is no `Declaration` with a
 * `property` field to visit — you match the call and read `arguments`.
 *
 * These specs pin the answer so the next rule for either format is written against it
 * rather than against a probe. The ASTs themselves were read out of the packages, not
 * out of a README, and `every ast names the package it came from` is what stops this
 * list drifting away from them silently.
 */
test('local formats: css says how to reach a declaration', (t) => {
    const [css] = parse().filter(({id}: {id: string;}) => id === 'css');
    const result = css.ast;
    
    // No metacharacters here on purpose. `t.match` compiles a real RegExp, and a
    // pattern containing `__b` does not mean what it looks like: `__` is the
    // `u`-flag spelling of `_`, and without the flag it is a word boundary, which
    // is why the first version of this assertion failed on a string that plainly
    // contains the text.
    t.match(result, 'declarations are');
    t.end();
});

test('local formats: css names the rule pattern key a matcher uses', (t) => {
    const [css] = parse().filter(({id}: {id: string;}) => id === 'css');
    const result = css.ast.includes('rule(');
    
    t.ok(result);
    t.end();
});

/**
 * The three added in `happy-style` 1.0.6, each of which used to be a bare opaque
 * string. This is the difference between a rule that can rewrite the inside of
 * `[full-start]` and one that cannot.
 */
test('local formats: css names the bracketed value nodes', (t) => {
    const [css] = parse().filter(({id}: {id: string;}) => id === 'css');
    const result = css.ast.includes('brackets');
    
    t.ok(result);
    t.end();
});

test('local formats: css names declaration and how to read one', (t) => {
    const [css] = parse().filter(({id}: {id: string;}) => id === 'css');
    const result = css.ast.includes('arguments[0]');
    
    t.ok(result);
    t.end();
});

test('local formats: markdown says how to reach a heading', (t) => {
    const [markdown] = parse().filter(({id}: {id: string;}) => id === 'markdown');
    const result = markdown.ast;
    
    t.match(result, 'heading');
    t.end();
});

test('local formats: css names the npm parser it came from', (t) => {
    const [css] = parse().filter(({id}: {id: string;}) => id === 'css');
    const result = css.source;
    
    t.match(result, 'happy-style');
    t.end();
});

test('local formats: markdown names the npm parser it came from', (t) => {
    const [markdown] = parse().filter(({id}: {id: string;}) => id === 'markdown');
    const result = markdown.source;
    
    t.match(result, 'happy-mark');
    t.end();
});

test('local formats: every ast names the package it came from', (t) => {
    const result = parse()
        .filter(({ast}: {ast?: string;}) => Boolean(ast))
        .every(({source}: {source?: string;}) => Boolean(source));
    
    t.ok(result);
    t.end();
});

test('local formats: javascript needs no ast, it is the reference', (t) => {
    const [javascript] = parse().filter(({id}: {id: string;}) => id === 'javascript');
    const result = javascript.ast;
    
    t.notOk(result);
    t.end();
});
