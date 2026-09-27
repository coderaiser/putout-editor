import {test} from 'supertape';
import {rules} from '../lib/index.js';

const isFn = (a) => typeof a === 'function';

test('plugin: exports a rules map', (t) => {
    const result = !Array.isArray(rules) && typeof rules === 'object';
    
    t.ok(result);
    t.end();
});

test('plugin: every rule is reportable and actionable', (t) => {
    const result = Object
        .entries(rules)
        .filter(([, rule]) => isFn(rule.report) && isFn(rule.match))
        .map(([name]) => name);
    
    const expected = ['press-modifier-case'];
    
    t.deepEqual(result, expected);
    t.end();
});
