import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {test} from 'supertape';
import putout, {print} from 'putout';
import {parseFilesystem} from '@putout/test/filesystem';
import {rules} from '../lib/index.js';

// The README's ❌/✅ pair is documentation that `putout .` also lints, and those two jobs are opposed: a fence that demonstrates a violation is by definition code the rule rejects, so `--fix` "corrects" it — which happened to apply-press-modifier-case, leaving both blocks byte-identical without anything failing. The check is therefore behavioural, not textual: a byte comparison against the fixture was the obvious thing to write and it does not hold, because the README examples are deliberately different code (a MODIFIERS array, not the fixture's `const a`) since they are examples rather than tests. What must hold is that the ❌ fence still reports and the ✅ fence does not.
const isUndefined = (a) => typeof a === 'undefined';

const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');

const NAMES = Object.keys(rules);

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

const ROOT = '/project';

const TOKENS = 'tokens.css';

// `remove-undefined-token` reports a `var()` no stylesheet defines, so the tree needs a tokens.css or every example reports and the ✅ half of this check is vacuous. Which tokens exist is taken from the ✅ fence, because that fence is the definition of correct: if ✅ names a token, that token is defined. Deriving from the fence under test would define the very name the ❌ fence is about.
const tokensOf = (source) => {
    const names = [];
    
    for (const [, name] of source.matchAll(/var\((--[\dA-Za-z-]+)/g)) {
        names.push(name);
    }
    
    return `:root {\n${names
        .map((name) => `    ${name}: 0;`)
        .join('\n')}\n}\n`;
};

const filesystemOf = (main, tokens) => print(parseFilesystem([
    '/',
    `${ROOT}/`,
    [`${ROOT}/main.css`, main],
    [`${ROOT}/${TOKENS}`, tokensOf(tokens)],
]));

// A rule built on `matchFiles` exports `scan`; a code rule does not.
const isFilesystem = (plugin) => Boolean(plugin.scan);

const placesOf = (name, mark) => {
    const plugin = rules[name];
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
            ['filesystem', [name, plugin]],
        ],
    }).places.length;
};

const countOf = (mark) => (name) => placesOf(name, mark);

test('readme: every rule has a section with a ❌ and a ✅ example', (t) => {
    const result = NAMES.filter((name) => fenceOf(name, '❌') === null || fenceOf(name, '✅') === null);
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('readme: every ❌ example is still rejected by its own rule', (t) => {
    const count = countOf('❌');
    const result = NAMES.filter((name) => !count(name));
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('readme: every ✅ example is accepted by its own rule', (t) => {
    const count = countOf('✅');
    const result = NAMES.filter(count);
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});
