import {test} from 'supertape';
import {normalizeRule} from './normalizeRule.ts';

test('normalizeRule: returns code unchanged when less than 2 lines', (t) => {
    const result = normalizeRule('// comment');
    const expected = '// comment';
    
    t.equal(result, expected);
    t.end();
});

test('normalizeRule: returns code unchanged when first line is not a comment', (t) => {
    const result = normalizeRule('export const x = 1;\nexport const y = 2;');
    const expected = 'export const x = 1;\nexport const y = 2;';
    
    t.equal(result, expected);
    t.end();
});

test('normalizeRule: returns code unchanged when blank line already exists after comment', (t) => {
    const result = normalizeRule('// comment\n\nexport const x = 1;');
    const expected = '// comment\n\nexport const x = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('normalizeRule: inserts blank line between comment and first export', (t) => {
    const result = normalizeRule('// comment\nexport const x = 1;');
    const expected = '// comment\n\nexport const x = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('normalizeRule: inserts blank line when multiple exports follow comment', (t) => {
    const input = '// comment\nexport const report = () => "";\nexport const replace = () => ({});';
    const expected = '// comment\n\nexport const report = () => "";\nexport const replace = () => ({});';
    const result = normalizeRule(input);
    
    t.equal(result, expected);
    t.end();
});

test('normalizeRule: does not modify code with no comment', (t) => {
    const input = 'export const report = () => "";\nexport const replace = () => ({});';
    const result = normalizeRule(input);
    const expected = input;
    
    t.equal(result, expected);
    t.end();
});

test('normalizeRule: handles empty string', (t) => {
    const result = normalizeRule('');
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});
