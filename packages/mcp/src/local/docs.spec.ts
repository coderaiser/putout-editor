import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './docs.ts';

test('local docs: name is \'docs\'', (t) => {
    t.equal(name, 'docs');
    t.end();
});

test('local docs: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local docs: schema has optional section field', (t) => {
    t.ok('section' in schema.shape);
    t.end();
});

test('local docs: schema restricts section to api and errors', (t) => {
    const result = [...schema.shape.section.unwrap().options].sort();
    const expected = [
        'api',
        'errors',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local docs: returns text content', async (t) => {
    const result = await handler();
    
    t.equal(typeof result.content[0].text, 'string');
    t.end();
});

test('local docs: content includes putout-editor', async (t) => {
    const result = await handler();
    
    t.match(result.content[0].text, 'putout-editor');
    t.end();
});

test('local docs: returns overview when no section', (t) => {
    const result = handler();
    
    t.match(result.content[0].text, 'putout-editor');
    t.end();
});

test('local docs: overview points to get_example', (t) => {
    const result = handler();
    
    t.match(result.content[0].text, 'get_example');
    t.end();
});

test('local docs: overview no longer inlines plugin patterns', (t) => {
    const result = handler();
    
    t.notMatch(result.content[0].text, 'export const replace');
    t.end();
});

test('local docs: returns api section', (t) => {
    const result = handler({
        section: 'api',
    });
    
    t.match(result.content[0].text, '/api/v1/parse');
    t.end();
});

test('local docs: api section lists the transform endpoint', (t) => {
    const result = handler({
        section: 'api',
    });
    
    t.match(result.content[0].text, '/api/v1/transform');
    t.end();
});

test('local docs: returns errors section', (t) => {
    const result = handler({
        section: 'errors',
    });
    
    t.match(result.content[0].text, 'plugin_syntax');
    t.end();
});

test('local docs: errors section documents line and col', (t) => {
    const result = handler({
        section: 'errors',
    });
    
    t.match(result.content[0].text, 'line N, col N');
    t.end();
});

test('local docs: api section is not the overview', (t) => {
    const result = handler({
        section: 'api',
    });
    
    t.notMatch(result.content[0].text, 'get_example');
    t.end();
});
