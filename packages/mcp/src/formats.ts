import {z} from 'zod';

export const name = 'formats';

export const description =
    'List the file formats putout-editor can transform, with the wrapper call, the ' +
    'operator and the node shapes a rule targets. Use this before writing a rule for ' +
    'anything other than plain JavaScript, so the fixture and the matcher are in the ' +
    'format putout-editor actually stores. The source of truth is the client: ' +
    'packages/client/src/snippet/templates (one template + fixture per category).';

export const schema = z.object({});

type Format = {
    id: string;
    wrapper: string | null;
    operator: string | null;
    fixture: string;
    
    /**
     * How a **rule** reaches a node, for the formats whose AST is not babel's.
     *
     * `fixture` shows what a file looks like, which is the wrong question when
     * writing a rule: the hard half is the path *into* the tree. Both `happy-style`
     * and `happy-mark` lower their document to JS call expressions, so there is no
     * `Declaration` node with a `property` field to visit — you match the call and
     * read `arguments`.
     */
    ast?: string;
    
    /** The npm package the `ast` was read out of, so it can be re-checked. */
    source?: string;
};

/**
 * Read out of `happy-style` by running `convertCssToJs`, not copied from its README:
 * the `functionValue` arguments come back with an `operator` node for every
 * separator, which is the part a rule has to skip over and the part a hand-written
 * example gets wrong.
 *
 * A template literal rather than `[...].join('\n')`, which `montag/apply` rejects
 * — and `montag` is not a dependency of this package, so the dependency is not
 * worth a string constant. The backticks that would have to be escaped are the only
 * thing lost, and they are decoration.
 */
const CSS_AST = `rule(selector([...]), [declaration(...)]) — match 'rule(__a, __b)' and the
declarations are '__b.elements', NOT a node to visit.
Each is declaration('<property>', <value>): the property is
arguments[0].value, and extra.rawValue must move with it when you rewrite one.
Values: valueList([...]), functionValue('<name>', [...]), dimension(n, 'px'),
percentage(n), operator('-') between arguments, and a bare quoted string for
a keyword — box-sizing: border-box is declaration('box-sizing', 'border-box').
brackets([...]) and parentheses([...]) wrap children the same way, and
unicodeRange('U+0-7F') is one token with no children.`;

/** Read out of `happy-mark` the same way, and the top level is a flat array. */
const MARKDOWN_AST = `A flat array of calls: heading(<level>, 'text'), paragraph(...inline...),
ul(li('one'), li('two')), codeblock('<lang>', '<text>'), blockquote(...),
link('text', 'url'), image('alt', 'url'). Inline content is an argument
position, not a child array — **bold** inside a paragraph is bold('bold').`;

const FORMATS: Format[] = [{
    id: 'javascript',
    wrapper: null,
    operator: null,
    fixture: 'const a = 1;',
}, {
    id: 'markdown',
    wrapper: '__putout_processor_markdown([...])',
    operator: '__markdown',
    fixture: `__putout_processor_markdown([
    heading(2, 'Hello World')
]);`,
    ast: MARKDOWN_AST,
    source: 'happy-mark (npm) — `convertMarkdownToJs`',
}, {
    id: 'json',
    wrapper: '__putout_processor_json({...})',
    operator: '__json',
    fixture: `__putout_processor_json({
    "keywords": ["putout", "codemod"]
});`,
}, {
    id: 'yaml',
    wrapper: '__putout_processor_yaml({...})',
    operator: '__yaml',
    fixture: `__putout_processor_yaml({
    "jobs": {
        "build": {
            "needs": []
        }
    }
});`,
}, {
    id: 'toml',
    wrapper: '__putout_processor_toml({...})',
    operator: '__toml',
    fixture: `__putout_processor_toml({
    "dependencies": {}
});`,
}, {
    id: 'css',
    wrapper: '__putout_processor_css([...])',
    operator: '__css',
    fixture: `__putout_processor_css([
    rule(selector([
        classSelector('hello')
    ]), [
        declaration('box-shadow', valueList([
            functionValue('rgb', [0, 0, 0, percentage(20)])
        ]))
    ])
]);`,
    ast: CSS_AST,
    source: 'happy-style (npm) — `convertCssToJs`',
}, {
    id: 'docker',
    wrapper: '__putout_processor_docker([...])',
    operator: '__docker',
    fixture: `__putout_processor_docker([
    ["MAINTAINER", "John <john@example.com>"]
]);`,
}, {
    id: 'ignore',
    wrapper: '__putout_processor_ignore([...])',
    operator: '__ignore',
    fixture: `__putout_processor_ignore([
    "*.lock", "node_modules"
]);`,
}, {
    id: 'filesystem',
    wrapper: '__putout_processor_filesystem([...])',
    operator: '__file',
    fixture: `__putout_processor_filesystem([
    "/",
    "/index.js"
]);`,
}];

export const handler = () => ({
    content: [{
        type: 'text' as const,
        text: JSON.stringify(FORMATS, null, 2),
    }],
});
