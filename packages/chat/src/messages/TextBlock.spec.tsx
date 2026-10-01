import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import TextBlock from './TextBlock.tsx';

const text = (data: string) => render(
    <TextBlock
        data={data}
    />,
);

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

test('TextBlock: renders the text', (t) => {
    text('hello');
    
    const result = read('[data-testid="text-block"]');
    const expected = 'hello';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TextBlock: bolds markdown bold', (t) => {
    text('a **b** c');
    
    const result = read('strong');
    const expected = 'b';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TextBlock: inlines markdown code', (t) => {
    text('use `/ast` first');
    
    const result = read('code');
    const expected = '/ast';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TextBlock: keeps a fenced block out of the inline pass', (t) => {
    text('```js\nconst a = **not bold**;\n```');
    
    const result = document.querySelectorAll('strong').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TextBlock: renders a fenced block line by line', (t) => {
    text('```js\nconst a = 1;\n```');
    
    const result = document.querySelectorAll('.text-block__fence').length;
    const expected = 3;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('TextBlock: splits a multi-line answer into one line each', (t) => {
    text('one\ntwo');
    
    const result = document.querySelectorAll('.text-block__line').length;
    const expected = 2;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
