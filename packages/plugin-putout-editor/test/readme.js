import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {test} from 'supertape';
import putout from 'putout';
import {rules} from '../lib/index.js';

const isUndefined = (a) => typeof a === 'undefined';

const readme = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');

const pluginOf = (name) => {
    const rule = rules[name];
    
    return Array.isArray(rule) ? rule[1] : rule;
};

const isFileRule = (name) => name.endsWith('-file');

const NAMES = Object
    .keys(rules)
    .filter((name) => !isFileRule(name));

const missingFence = (name) => fenceOf(name, '❌') === null || fenceOf(name, '✅') === null;

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
    
    const [, fence] = rest.split('```');
    const lines = fence.split('\n');
    const body = /^\s*[a-z]+\s*$/.test(lines[0]) ? lines.slice(1) : lines;
    
    return body
        .join('\n')
        .trim();
};

const placesOf = (name, mark) => {
    const source = fenceOf(name, mark);
    
    if (source === null)
        return null;
    
    const {places} = putout(source, {
        fix: false,
        plugins: [
            [name, pluginOf(name)],
        ],
    });
    
    return places.length;
};

test('readme: every code rule has a section with a ❌ and a ✅ example', (t) => {
    const result = NAMES.filter(missingFence);
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('readme: every ❌ example is still rejected by its own rule', (t) => {
    const result = NAMES.filter((name) => !placesOf(name, '❌'));
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('readme: every ✅ example is accepted by its own rule', (t) => {
    const result = NAMES.filter((name) => placesOf(name, '✅'));
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});
