import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import {rules} from '../lib/index.js';

// The README's ❌/✅ pair is documentation that `putout .` also lints, and those two jobs are opposed: a fence that demonstrates a violation is by definition code the rule rejects, so `--fix` "corrects" it — which happened to apply-press-modifier-case, leaving both blocks byte-identical without anything failing. The check is therefore behavioural, not textual: a byte comparison against the fixture was the obvious thing to write and it does not hold, because the README examples are deliberately different code (a MODIFIERS array, not the fixture's `const a`) since they are examples rather than tests. What must hold is that the ❌ fence still reports and the ✅ fence does not.
const isUndefined = (a) => typeof a === 'undefined';
const isFilesystem = (plugin) => Boolean(plugin.scan);
const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');
const NAMES = Object.keys(rules);
const ROOT = '/project';
const TOKENS = 'tokens.css';

const pluginOf = (name) => {
    const rule = rules[name];
    
    return Array.isArray(rule) ? rule[1] : rule;
};

const missingFence = (name) => fenceOf(name, '❌') === null || fenceOf(name, '✅') === null;
const isRejected = (name) => Boolean(placesOf(name, '❌'));
const isAccepted = (name) => Boolean(placesOf(name, '✅'));

const sectionOf = (name) => {
    const [, section] = readme.split(`\n## ${name}\n`);
    
    return isUndefined(section) ? '' : section.split('\n***')[0];
};

const fenceOf = (name, mark) => {
    const section = sectionOf(name);
    
    if (section === '')
        return null;
    
    const [, rest] = section.split(`### ${mark} `);
    
    if (isUndefined(rest))
        return null;
    
    // ```js puts the language on the opening line; ``` followed by a newline puts it on the next
    // one. The code is whatever follows that language, and a rule that reads raw lines would
    // otherwise see the word and report on it.
    const [, fence] = rest.split('```');
    const lines = fence.split('\n');
    const body = /^\s*[a-z]+\s*$/.test(lines[0]) ? lines.slice(1) : lines;
    
    return body
        .join('\n')
        .trim();
};

const tokensOf = (source) => {
    const names = [];
    
    for (const [, name] of source.matchAll(/var\((--[\dA-Za-z-]+)/g)) {
        names.push(name);
    }
    
    const declarations = [];
    
    for (const name of names) {
        declarations.push(`    ${name}: 0;`);
    }
    
    return `:root {\n${declarations.join('\n')}\n}\n`;
};

const filesystemOf = (main, tokens) => print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/main.css`, main],
    [`${ROOT}/${TOKENS}`, tokensOf(tokens)],
]));

const placesOf = (name, mark) => {
    const plugin = pluginOf(name);
    const source = fenceOf(name, mark);
    
    if (source === null)
        return null;
    
    if (!isFilesystem(plugin))
        return putout(source, {
            fix: false,
            plugins: [
                [name, plugin],
            ],
        }).places.length;
    
    return putout(filesystemOf(source, fenceOf(name, '✅')), {
        fix: false,
        plugins: [
            [`place-of/${name}`, plugin]],
        ],
    }).places.length;
};

test('readme: every rule has a section with a ❌ and a ✅ example', (t) => {
    const result = NAMES.filter(missingFence);
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('readme: every ❌ example is still rejected by its own rule', (t) => {
    const result = NAMES.filter((name) => !isRejected(name));
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('readme: every ✅ example is accepted by its own rule', (t) => {
    const result = NAMES.filter(isAccepted);
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});
