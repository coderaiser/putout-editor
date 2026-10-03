import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {
    type Message as MessageModel,
    type CommandResult,
} from '#store';
import Message from './Message.tsx';

const message = (result: CommandResult | null): MessageModel => ({
    id: 1,
    text: '/x',
    result,
});

const row = (result: CommandResult | null) => render(
    <Message message={message(result)}/>,
);

test('Message: a text result renders the text block', (t) => {
    row({
        type: 'text',
        data: 'hello',
    });
    
    const result = document.querySelector('[data-testid="text-block"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Message: an error result renders the error block', (t) => {
    row({
        type: 'error',
        message: 'boom',
    });
    
    const result = document.querySelector('.error-block') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Message: a source result renders the source block', (t) => {
    row({
        type: 'source',
        data: 'const a = 1;',
    });
    
    const result = document.querySelector('[data-testid="source-block"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Message: an ast result renders the tree', (t) => {
    row({
        type: 'ast',
        nodes: [],
        source: '',
    });
    
    const result = document.querySelector('[data-testid="ast-output"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Message: a places result renders the list', (t) => {
    row({
        type: 'places',
        data: [{
            message: 'use const',
            position: {
                line: 1,
                column: 0,
            },
        }],
    });
    
    const result = document.querySelector('[data-testid="places-list"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Message: a transform result renders the diff', (t) => {
    row({
        type: 'transform',
        before: 'a',
        after: 'b',
    });
    
    const result = document.querySelector('[data-testid="transform-diff"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Message: a message with no result yet renders nothing inside', (t) => {
    row(null);
    
    const element = document.querySelector('[data-testid="message"]');
    const result = element && element.children.length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('Message: the row carries the message testid', (t) => {
    row({
        type: 'text',
        data: 'x',
    });
    
    const result = document.querySelectorAll('[data-testid="message"]').length;
    const expected = 1;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
