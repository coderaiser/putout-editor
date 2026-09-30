import {test} from 'supertape';
import {text, errorText} from './content.ts';

test('content: text: wraps a string in the mcp envelope', (t) => {
    const result = text('hello');
    const expected = {
        content: [{
            type: 'text',
            text: 'hello',
        }],
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('content: errorText: prefixes an Error message', (t) => {
    const result = errorText(Error('boom'));
    const expected = 'Error: boom';
    
    t.equal(result.content[0].text, expected);
    t.end();
});

test('content: errorText: accepts a thrown non-Error', (t) => {
    const result = errorText('just a string');
    const expected = 'Error: just a string';
    
    t.equal(result.content[0].text, expected);
    t.end();
});
