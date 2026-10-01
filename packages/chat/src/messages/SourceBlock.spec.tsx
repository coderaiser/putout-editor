import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {textsOf} from '../../test/dom.ts';
import SourceBlock from './SourceBlock.tsx';

const source = (data: string) => render(
    <SourceBlock
        data={data}
    />,
);

test('SourceBlock: numbers the lines from one', (t) => {
    source('const a = 1;\nconst b = 2;');
    
    const result = textsOf('.source-block__gutter');
    const expected = ['1', '2'];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('SourceBlock: shows the source text', (t) => {
    source('const a = 1;');
    
    const element = document.querySelector('.source-block__text');
    const result = element && element.textContent;
    const expected = 'const a = 1;';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('SourceBlock: an empty source says so rather than showing an empty box', (t) => {
    source('');
    
    const element = document.querySelector('[data-testid="source-block"]');
    const result = element && element.textContent;
    const expected = 'Source cleared';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('SourceBlock: an empty source draws no lines', (t) => {
    source('');
    
    const result = document.querySelectorAll('.source-block__line').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
