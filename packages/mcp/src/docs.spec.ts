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
    const result = Object.keys(schema.shape);
    const expected = ['section'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local docs: schema restricts section to style, template, api and errors', (t) => {
    const result = [...schema.shape.section.unwrap().options].sort();
    const expected = [
        'api',
        'errors',
        'style',
        'template',
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

test('local docs: returns style section', (t) => {
    const result = handler({
        section: 'style',
    });
    
    t.match(result.content[0].text, 'idiomatic putout plugin');
    t.end();
});

test('local docs: style says a rule imports from putout only', (t) => {
    const result = handler({
        section: 'style',
    });
    
    t.match(result.content[0].text, 'peerDependency');
    t.end();
});

test('local docs: style names the two package shapes', (t) => {
    const result = handler({
        section: 'style',
    });
    
    t.match(result.content[0].text, 'lib/index.js');
    t.end();
});

test('local docs: style points at the full guide in the repo', (t) => {
    const result = handler({
        section: 'style',
    });
    
    t.match(result.content[0].text, 'docs/putout-style.md');
    t.end();
});

test('local docs: style warns the ?. fixer exits clean', (t) => {
    const result = handler({
        section: 'style',
    });
    
    t.match(result.content[0].text, 'exits 0');
    t.end();
});

test('local docs: style says to run tsc after the fixer', (t) => {
    const result = handler({
        section: 'style',
    });
    
    t.match(result.content[0].text, 'run tsc');
    t.end();
});

test('local docs: returns template section', (t) => {
    const result = handler({
        section: 'template',
    });
    
    t.match(result.content[0].text, 'PutoutScript');
    t.end();
});

test('local docs: template section explains linked values', (t) => {
    const result = handler({
        section: 'template',
    }).content[0].text;
    
    t.match(result, 'LINKED');
    t.end();
});

test('local docs: template section names every value', (t) => {
    const result = handler({
        section: 'template',
    }).content[0].text;
    const missing = [
        '__args',
        '__object',
        '__array',
        '__imports',
        '__exports',
        '__args__a',
    ].filter((value) => !result.includes(value));
    
    const expected: string[] = [];
    
    t.deepEqual(missing, expected);
    t.end();
});

test('local docs: template section warns about the silent no-op', (t) => {
    const result = handler({
        section: 'template',
    }).content[0].text;
    
    t.match(result, 'Looks like template values not linked');
    t.end();
});

test('local docs: template section says __object needs an expression position', (t) => {
    const result = handler({section: 'template'}).content[0].text;
    
    t.match(result, 'EXPRESSION values');
    t.end();
});

test('local docs: template section points at test_pattern', (t) => {
    const result = handler({
        section: 'template',
    }).content[0].text;
    
    t.match(result, 'test_pattern');
    t.end();
});

test('local docs: schema accepts the template section', (t) => {
    const result = schema.safeParse({
        section: 'template',
    }).data.section;
    const expected = 'template';
    
    t.equal(result, expected);
    t.end();
});

test('local docs: overview advertises test_pattern', (t) => {
    const result = handler().content[0].text;
    
    t.match(result, 'test_pattern');
    t.end();
});

test('local docs: overview advertises the style section', (t) => {
    const result = handler();
    
    t.match(result.content[0].text, 'style');
    t.end();
});
