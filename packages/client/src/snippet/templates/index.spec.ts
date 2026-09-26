import {test} from 'supertape';
import {
    categories,
    fixtures,
    templates,
} from './index.ts';

test('templates: categories has 13 entries', (t) => {
    t.equal(categories.length, 13);
    t.end();
});

test('templates: fixtures map has 13 entries', (t) => {
    t.equal(Object.keys(fixtures).length, 13);
    t.end();
});

test('templates: templates map has 13 entries', (t) => {
    t.equal(Object.keys(templates).length, 13);
    t.end();
});

test('templates: every category has a fixture', (t) => {
    const result = categories.filter((category) => !fixtures[category]);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('templates: every category has a template', (t) => {
    const result = categories.filter((category) => !templates[category]);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
