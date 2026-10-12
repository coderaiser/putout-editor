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

/**
 * The TypeScript dialect, which is the whole reason `highlight` configures one.
 *
 * Every assertion here names the **span** it wants rather than a bare token
 * class, and that is not fussiness: under the plain JavaScript grammar
 * `interface`, `type`, `enum`, `declare`, `satisfies` and `implements` all parse
 * as *variable names*, so a `t.match(result, 'tok-keyword')` on a line that
 * already contains `const` or `let` passes either way and pins nothing. Confirmed
 * by stashing `highlight.ts` and re-running this file: with the JS grammar only
 * the span-level assertions below fail. Measured against
 * `@lezer/javascript@1.5.5`.
 */
test('highlight: interface is a keyword and its members are TS tokens', (t) => {
    const result = highlight('interface Foo { bar: string; }');
    
    const expected = [
        '<span class="tok-keyword">interface</span>',
        '<span class="tok-typeName">Foo</span>',
        '<span class="tok-propertyName tok-definition">bar</span>',
        '<span class="tok-typeName">string</span>',
    ];
    
    t.ok(expected.every((span) => result.includes(span)));
    t.end();
});

test('highlight: a type alias keyword is not a variable name', (t) => {
    const result = highlight('type A = string;');
    
    const expected = [
        '<span class="tok-keyword">type</span>',
        '<span class="tok-typeName">A</span>',
    ];
    
    t.ok(expected.every((span) => result.includes(span)));
    t.end();
});

test('highlight: an enum is a keyword and its members are property names', (t) => {
    const result = highlight('enum Color { Red, Blue }');
    
    const expected = [
        '<span class="tok-keyword">enum</span>',
        '<span class="tok-typeName">Color</span>',
        '<span class="tok-propertyName">Red</span>',
    ];
    
    t.ok(expected.every((span) => result.includes(span)));
    t.end();
});

test('highlight: declare is a keyword', (t) => {
    const result = highlight('declare const x: number;');
    
    // `const` is a keyword under either grammar, so `declare` is the half that
    // decides it — and it is a variable name without the dialect.
    t.match(result, '<span class="tok-keyword">declare</span>');
    t.end();
});

test('highlight: satisfies is a keyword and its target a type name', (t) => {
    const result = highlight('let x = y satisfies Foo;');
    
    const expected = [
        '<span class="tok-keyword">satisfies</span>',
        '<span class="tok-typeName">Foo</span>',
    ];
    
    t.ok(expected.every((span) => result.includes(span)));
    t.end();
});

test('highlight: implements is a keyword and its target a type name', (t) => {
    const result = highlight('class C implements I {}');
    
    const expected = [
        '<span class="tok-keyword">implements</span>',
        '<span class="tok-typeName">I</span>',
    ];
    
    t.ok(expected.every((span) => result.includes(span)));
    t.end();
});
