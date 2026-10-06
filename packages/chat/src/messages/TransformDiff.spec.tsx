import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {textsOf} from '../../test/dom.ts';
import TransformDiff from './TransformDiff.tsx';

const diff = (before: string, after: string) => render(
    <TransformDiff
        after={after}
        before={before}
    />,
);

test('TransformDiff: renders a before block', (t) => {
    diff('const a = 1;', 'const b = 1;');
    
    const element = document.querySelector('.transform-diff__code--before');
    const result = element && element.textContent;
    const expected = 'const a = 1;';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TransformDiff: renders an after block', (t) => {
    diff('const a = 1;', 'const b = 1;');
    
    const element = document.querySelector('.transform-diff__code--after');
    const result = element && element.textContent;
    const expected = 'const b = 1;';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TransformDiff: titles both sides', (t) => {
    diff('a', 'b');
    
    const result = textsOf('.transform-diff__title');
    const expected = [
        'before',
        'after',
    ];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('TransformDiff: renders a multi-line source line by line', (t) => {
    diff('a\nb', 'c\nd');
    
    const result = document.querySelectorAll('.transform-diff__line').length;
    const expected = 4;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TransformDiff: carries the transform-diff testid', (t) => {
    diff('a', 'b');
    
    const result = document.querySelector('[data-testid="transform-diff"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TransformDiff: an unchanged transform says so rather than drawing the text twice', (t) => {
    diff('const a = 1;', 'const a = 1;');
    
    const element = document.querySelector('[data-testid="transform-diff"]');
    const result = element && element.textContent;
    const expected = 'No changes';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TransformDiff: an unchanged transform draws no before or after block', (t) => {
    diff('const a = 1;', 'const a = 1;');
    
    const result = document.querySelectorAll('.transform-diff__side').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TransformDiff: before block contains tok- spans', (t) => {
    diff('const a = 1;', 'const a = 2;');
    
    const code = document.querySelector('.transform-diff__code--before');
    const result = code && code.innerHTML.includes('tok-') || false;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TransformDiff: after block contains tok- spans', (t) => {
    diff('const a = 1;', 'const a = 2;');
    
    const code = document.querySelector('.transform-diff__code--after');
    const result = code && code.innerHTML.includes('tok-') || false;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
