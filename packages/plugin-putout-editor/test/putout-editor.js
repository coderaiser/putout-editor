import {test} from 'supertape';
import {rules} from '../lib/index.js';

const EXPECTED = [
    'apply-press-modifier-case',
    'check-main-imports-in-file',
    'remove-comments',
    'remove-rgb-outside-token-file',
    'remove-undefined-token-file',
    'remove-z-index-outside-token-file',
];

const isOff = (rule) => Array.isArray(rule);

const pluginOf = (rule) => isOff(rule) ? rule[1] : rule;

const unloadable = (name) => !pluginOf(rules[name]).report;

const isFileRule = (name) => name.endsWith('-file');

const fileRules = (name) => isFileRule(name) && !isOff(rules[name]);

const codeRules = (name) => !isFileRule(name) && isOff(rules[name]);

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

test('plugin-putout-editor: a -file rule is off by default', (t) => {
    const result = Object
        .keys(rules)
        .filter(fileRules);
    
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('plugin-putout-editor: a code rule is on by default', (t) => {
    const result = Object
        .keys(rules)
        .filter(codeRules);
    
    const expected = [
        'remove-comments',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
