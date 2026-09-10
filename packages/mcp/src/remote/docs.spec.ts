import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './docs.ts';

test('remote docs: name is \'docs\'', (t) => {
    t.equal(name, 'docs');
    t.end();
});

test('remote docs: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('remote docs: schema is empty object', (t) => {
    const result = schema;
    const expected = {};
    
    t.deepEqual(result, expected);
    t.end();
});

test('remote docs: returns text content', async (t) => {
    const result = await handler();
    
    t.equal(typeof result.content[0].text, 'string');
    t.end();
});

test('remote docs: content includes putout-editor', async (t) => {
    const result = await handler();
    
    t.match(result.content[0].text, 'putout-editor');
    t.end();
});
