import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {z} from 'zod';

export const name = 'get_example';

export const description =
    'Return a working plugin template and its matching fixture for a given pattern. ' +
    'Use this to get runnable code before writing your own plugin. ' +
    'Pattern selection order: replacer first - replace() maps are unconditional; add match() ' +
    'to decide per-match, that is still a replacer. If replace cannot express the rule, ' +
    'use includer (report + include + filter + fix). If state across nodes is needed, ' +
    'use traverser (report + traverse + fix). For filesystem rules use scanner (report + scan + fix). ' +
    'For auto-inserting missing imports use declarator (declare only). ' +
    'finder is an advanced pattern - do not suggest it unless the user names it explicitly. ' +
    'The markdown pattern shows a rule for non-JavaScript source - call formats for other wrappers. ' +
    'Available patterns: replacer, traverser, includer, finder, declarator, scanner, markdown.';

const PATTERNS = [
    'replacer',
    'traverser',
    'includer',
    'finder',
    'declarator',
    'scanner',
    'markdown',
] as const;

type Pattern = typeof PATTERNS[number];

export const schema = z.object({
    pattern: z
        .enum(PATTERNS)
        .describe('Plugin pattern to fetch an example for'),
});

type Example = {
    plugin: string;
    fixture: string;
};

const replacerPlugin = `// convert-ternary-to-if

export const report = () => \`Use 'if' instead of ternary 🧹\`;

export const replace = () => ({
    '__a ? __b : __c': 'if (__a) __b; else __c;',
});`;

const replacerFixture = `// convert-ternary-to-if

'Transform your code with 🐊Putout' ?
    console.log('Codemods never been as simple 🎈') :
    console.log('🥵');`;

const traverserPlugin = `// merge-duplicate-imports

import {operator, types} from 'putout';

const {remove} = operator;
const {isImportDeclaration} = types;

export const report = ({path}) =>
    \`Merge duplicate import from '\${path.node.source.value}' 🧹\`;

export const fix = ({path, original}) => {
    original.node.specifiers.push(...path.node.specifiers);
    remove(path);
};

export const traverse = ({push}) => ({
    Program(path) {
        const imports = path.get('body').filter(isImportDeclaration);
        const seen = new Map();
        
        for (const imp of imports) {
            const src = imp.node.source.value;
            
            if (!seen.has(src)) {
                seen.set(src, imp);
                continue;
            }
            
            push({path: imp, original: seen.get(src)});
        }
    },
});`;

const traverserFixture = `// merge-duplicate-imports

import {a} from 'x';
import {b} from 'x';`;

const includerPlugin = `// remove-empty-method

export const report = () => 'Remove empty method 🧹';

export const filter = (path) => {
    if (path.isClassMethod() || path.isObjectMethod())
        return path.node.params.length === 0 && path.node.body.body.length === 0;
    
    return false;
};

export const include = () => ['ClassMethod', 'ObjectMethod'];

export const fix = (path) => path.remove();`;

const includerFixture = `// remove-empty-method

const obj = {
    greet() {},
    greetWithName(name) {
        return \`hello \${name}\`;
    },
};`;

const finderPlugin = `// find-duplicate-values

import {types} from 'putout';

const {isIdentifier} = types;

export const report = ({name}) => \`Duplicate numeric value in '\${name}' 🔍\`;

export const find = (ast, {traverse, push}) => {
    const seen = new Map();
    
    traverse(ast, {
        VariableDeclarator(path) {
            const {id, init} = path.node;
            
            if (!isIdentifier(id) || !init || init.type !== 'NumericLiteral')
                return;
            
            const {value} = init;
            
            if (seen.has(value)) {
                push({path, name: id.name});
                return;
            }
            
            seen.set(value, id.name);
        },
    });
};

export const fix = ({path}) => path.remove();`;

const finderFixture = `// find-duplicate-values

const x = 1;
const y = 1;
const z = 2;`;

const declaratorPlugin = `// declare-putout-imports

export const declare = () => ({
    putout: "import putout from 'putout'",
    operator: "import {operator} from 'putout'",
    types: "import {types} from 'putout'",
});`;

const declaratorFixture = `// declare-putout-imports

const {code} = putout(source, {plugins: []});`;

const scannerPlugin = `// remove-spec

const {getFilename, getFileType, removeFile} = operator;
const isFile = (file) => getFileType(file) === 'file';
const isSpec = (name) => name.includes('.spec.');

export const report = ({name}) => \`No test found for '\${name}' 🔍\`;

export const fix = (file) => {
    removeFile(file);
};

export const scan = (root, {push, trackFile}) => {
    for (const file of trackFile(root, '*.js').filter(isFile)) {
        const name = getFilename(file);
        
        if (!isSpec(name))
            continue;
        
        push({
            path: file,
            name,
        });
    }
};`;

const scannerFixture = `__putout_processor_filesystem([
    "/",
    "/index.js",
    "/index.spec.js",
    "/utils.js"
]);`;

// The markdown rule is not ours - it ships in `@putout/plugin-markdown` - so read the
// installed source instead of keeping a copy of it here. A copy drifts, and this one
// already had: its `report` said something else and it passed `source.value` where the
// real rule uses `extract(source)`, so it taught a rule nobody runs. `examples.spec.ts`
// pins the two together, so a version bump that changes the rule fails the build rather
// than the docs.
export const SHIPPED_MARKDOWN_RULE = '@putout/plugin-markdown/lib/apply-ts-codeblock-in-file/convert-js-to-ts/index.js';

const markdownPlugin = readFileSync(
    createRequire(import.meta.url).resolve(SHIPPED_MARKDOWN_RULE),
    'utf8',
).trimEnd();

const markdownFixture = `__putout_processor_markdown([
    heading(1, 'Gate'),
    codeblock('js', 'const a: string[] = [];'),
    codeblock('js', 'const plain = [1, 2];')
]);`;

const EXAMPLES: Record<Pattern, Example> = {
    replacer: {
        plugin: replacerPlugin,
        fixture: replacerFixture,
    },
    traverser: {
        plugin: traverserPlugin,
        fixture: traverserFixture,
    },
    includer: {
        plugin: includerPlugin,
        fixture: includerFixture,
    },
    finder: {
        plugin: finderPlugin,
        fixture: finderFixture,
    },
    declarator: {
        plugin: declaratorPlugin,
        fixture: declaratorFixture,
    },
    scanner: {
        plugin: scannerPlugin,
        fixture: scannerFixture,
    },
    markdown: {
        plugin: markdownPlugin,
        fixture: markdownFixture,
    },
};

const formatExample = ({plugin, fixture}: Example) => `### Plugin\n\`\`\`js\n${plugin}\n\`\`\`\n\n### Fixture\n\`\`\`js\n${fixture}\n\`\`\``;

export function handler({pattern}: z.infer<typeof schema>) {
    const example = EXAMPLES[pattern];
    
    return {
        content: [{
            type: 'text' as const,
            text: `## ${pattern}\n\n${formatExample(example)}`,
        }],
    };
}
