import {readFileSync} from 'node:fs';
import {test} from 'supertape';
import {rules} from '../lib/index.js';

const EXPECTED = [
    'apply-press-modifier-case',
    'check-main-imports-only',
    'remove-comments',
    'remove-duplicated-receiver',
    'remove-rgb-outside-tokens',
    'remove-undefined-token',
    'remove-z-index-outside-tokens',
];

const pluginOf = (name) => {
    const rule = rules[name];
    
    return Array.isArray(rule) ? rule[1] : rule;
};

const unloadable = (name) => !pluginOf(name).report;

test('plugin-putout-editor: exports every rule', (t) => {
    const result = Object
        .keys(rules)
        .sort();
    
    const expected = [...EXPECTED].sort();
    
    t.deepEqual(result, expected);
    t.end();
});

test('plugin-putout-editor: every rule is a plugin putout can load', (t) => {
    const result = Object
        .keys(rules)
        .filter(unloadable);
    
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('plugin-putout-editor: the md match names every rule with a fence', (t) => {
    const md = JSON.parse(readFileSync(new URL('../.putout.json', import.meta.url), 'utf8'));
    const named = Object.keys(md.match['*.md']);
    
    const fenced = Object
        .keys(rules)
        .filter((name) => !pluginOf(name).scan);
    
    const result = fenced.filter((name) => !named.includes(`putout-editor/${name}`));
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});
