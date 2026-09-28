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

// The entrypoint. Every rule is tested in its own directory, beside the rule it
// tests, so this is the only place the map itself is asserted - a rule that was
// written and never registered would pass every other spec in the package.
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
