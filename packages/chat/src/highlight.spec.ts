import {test} from 'supertape';
import {escHtml, highlight} from './highlight.ts';

test('highlight: escHtml escapes &', (t) => {
    const result = escHtml('a&b');
    const expected = 'a&amp;b';
    
    t.equal(result, expected);
    t.end();
});

test('highlight: escHtml escapes <', (t) => {
    const result = escHtml('a<b');
    const expected = 'a&lt;b';
    
    t.equal(result, expected);
    t.end();
});

test('highlight: escHtml escapes >', (t) => {
    const result = escHtml('a>b');
    const expected = 'a&gt;b';
    
    t.equal(result, expected);
    t.end();
});

test('highlight: escHtml escapes ""', (t) => {
    const result = escHtml('a"b');
    const expected = 'a&quot;b';
    
    t.equal(result, expected);
    t.end();
});

test('highlight: escHtml escapes \'\'', (t) => {
    const result = escHtml('a\'b');
    const expected = 'a&#39;b';
    
    t.equal(result, expected);
    t.end();
});

test('highlight: escHtml leaves plain text unchanged', (t) => {
    const result = escHtml('hello');
    const expected = 'hello';
    
    t.equal(result, expected);
    t.end();
});

test('highlight: returns a non-empty string for valid JS', (t) => {
    const result = highlight('const x = 1;');
    
    t.ok(result.length > 0);
    t.end();
});

test('highlight: wraps keywords in tok-keyword spans', (t) => {
    const result = highlight('const x = 1;');
    
    t.match(result, 'tok-keyword');
    t.end();
});

test('highlight: wraps numbers in a tok-number span', (t) => {
    const result = highlight('const x = 42;');
    
    t.match(result, 'tok-number');
    t.end();
});

test('highlight: wraps string literals in a tok-string span', (t) => {
    const result = highlight('const s = "hello";');
    
    t.match(result, 'tok-string');
    t.end();
});

test('highlight: preserves newlines as literal newlines in the output', (t) => {
    const result = highlight('const a = 1;\nconst b = 2;');
    
    t.match(result, '\n');
    t.end();
});

test('highlight: escapes < inside a string literal', (t) => {
    const result = highlight('const s = "<div>";');
    
    t.match(result, '&lt;div&gt;');
    t.end();
});

test('highlight: handles empty string without throwing', (t) => {
    const result = highlight('');
    
    t.equal(typeof result, 'string');
    t.end();
});
