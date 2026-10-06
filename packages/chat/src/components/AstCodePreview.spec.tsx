import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import type {FlatNode} from '@putout/editor-commands';
import AstCodePreview, {
    insertMarker,
    linesOf,
    markedLine,
} from './AstCodePreview.tsx';

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

const SOURCE = 'const add = (a, b) => a + b;\nreturn add;';

const node = (over: Partial<FlatNode> = {}): FlatNode => ({
    id: '0',
    pid: null,
    depth: 0,
    type: 'Program',
    detail: '',
    line: 1,
    col: 0,
    endLine: 1,
    endCol: 10,
    ...over,
});

const preview = (selected: FlatNode | null) => render(
    <AstCodePreview
        selected={selected}
        source={SOURCE}
    />,
);

test('AstCodePreview: splits the source into lines', (t) => {
    const result = linesOf(SOURCE);
    const expected = [
        'const add = (a, b) => a + b;',
        'return add;',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstCodePreview: an empty source has no lines', (t) => {
    const result = linesOf('');
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstCodePreview: marks the column', (t) => {
    const result = markedLine('const a = 1;', 6);
    const expected = '<span class="tok-keyword">const</span> <span class="ast-col-marker">|</span><span class="tok-variableName tok-definition">a</span> <span class="tok-operator">=</span> <span class="tok-number">1</span><span class="tok-punctuation">;</span>';
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: col 0 gets no marker', (t) => {
    const result = markedLine('const a = 1;', 0);
    const expected = 'const a = 1;';
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: renders one line per source line', (t) => {
    preview(null);
    
    const result = document.querySelectorAll('.ast-code__line').length;
    const expected = 2;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: numbers the lines from one', (t) => {
    preview(null);
    
    const result = read('.ast-code__number');
    const expected = '1';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: highlights the selected node line', (t) => {
    preview(node({
        line: 2,
        col: 0,
    }));
    
    const result = document.querySelectorAll('[data-active="true"]').length;
    const expected = 1;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: highlights the second line for a node on line 2', (t) => {
    preview(node({
        line: 2,
        col: 0,
    }));
    
    const result = document
        .querySelectorAll('.ast-code__line')[1]
        .getAttribute('data-active');
    
    const expected = 'true';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: puts the column marker on the selected line', (t) => {
    preview(node({
        line: 1,
        col: 6,
    }));
    
    const result = read('.ast-code__text');
    const expected = '<span class="tok-keyword">const</span> <span class="ast-col-marker">|</span><span class="tok-variableName tok-definition">add</span> <span class="tok-operator">=</span> <span class="tok-punctuation">(</span><span class="tok-variableName tok-definition">a</span><span class="tok-punctuation">,</span> <span class="tok-variableName tok-definition">b</span><span class="tok-punctuation">)</span> <span class="tok-punctuation">=&gt;</span> <span class="tok-variableName">a</span> <span class="tok-operator">+</span> <span class="tok-variableName">b</span><span class="tok-punctuation">;</span>';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: no selection highlights nothing', (t) => {
    preview(null);
    
    const result = document.querySelectorAll('.ast-code__line--active').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: carries the code-preview testid', (t) => {
    preview(null);
    
    const result = document.querySelector('[data-testid="ast-code-preview"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: insertMarker inserts at col 0 by returning unchanged', (t) => {
    const result = insertMarker('<span class="tok-keyword">const</span>', 0);
    const expected = '<span class="tok-keyword">const</span>';
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: insertMarker inserts after the first plain character', (t) => {
    const result = insertMarker('abc', 1);
    const expected = 'a<span class="ast-col-marker">|</span>bc';
    
    t.equal(result, expected);
    t.end();
});

test('AstCodePreview: insertMarker skips span tags when counting columns', (t) => {
    // plain text: "const x" — col 6 is after "const " (6 chars)
    const html = '<span class="tok-keyword">const</span> x';
    const result = insertMarker(html, 6);
    
    // The marker should appear after the </span> and the space
    const hasMarker = result.includes('ast-col-marker');
    const expected = true;
    
    t.equal(hasMarker, expected);
    t.end();
});

test('AstCodePreview: insertMarker never puts the marker inside a tag', (t) => {
    const html = '<span class="tok-keyword">const</span> x';
    const result = insertMarker(html, 6);
    
    // Verify the marker is NOT inside the span tag
    const insideTag = result.includes('tok-keyword">|');
    const expected = false;
    
    t.equal(insideTag, expected);
    t.end();
});

test('AstCodePreview: highlighted lines contain tok- spans', (t) => {
    render(
        <AstCodePreview
            selected={node({
                line: 1,
                col: 6,
            })}
            source="const x = 1;"
        />,
    );
    
    const code = document.querySelector('.ast-code__text');
    const result = code && code.innerHTML.includes('tok-') || false;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
