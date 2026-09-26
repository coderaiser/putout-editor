import {test} from 'supertape';
import {
    handler,
    name,
    description,
    schema,
} from './parser.ts';

test('local parse: name is \'parse\'', (t) => {
    t.equal(name, 'parse');
    t.end();
});

test('local parse: description is a string', (t) => {
    const result = typeof description;
    const expected = 'string';
    
    t.equal(result, expected);
    t.end();
});

test('local parse: schema has source field', (t) => {
    t.ok('source' in schema.shape);
    t.end();
});

test('local parse: schema has optional query field', (t) => {
    t.ok('query' in schema.shape);
    t.end();
});

test('local parse: returns AST for valid source', async (t) => {
    const result = await handler({
        source: 'const x = 1;',
    });
    
    const ast = JSON.parse(result.content[0].text);
    
    t.equal(ast.type, 'File');
    t.end();
});

test('local parse: returns node positions when query provided', async (t) => {
    const result = await handler({
        source: 'var x = 1;',
        query: 'VariableDeclaration',
    });
    
    const nodes = JSON.parse(result.content[0].text);
    
    t.equal(nodes[0].type, 'VariableDeclaration');
    t.end();
});

test('local parse: query result includes source text of matched node', async (t) => {
    const result = await handler({
        source: 'var x = 1;',
        query: 'VariableDeclaration',
    });
    
    const nodes = JSON.parse(result.content[0].text);
    
    t.equal(nodes[0].text, 'var x = 1;');
    t.end();
});

test('local parse: returns error text on invalid source', async (t) => {
    const result = await handler({
        source: '{{{{ invalid',
    });
    
    t.ok(result.content[0].text.startsWith('Error:'));
    t.end();
});

test('local parse: returns empty array for non-matching query', async (t) => {
    const result = await handler({
        source: 'const x = 1;',
        query: 'NonExistentType',
    });
    
    t.equal(JSON.parse(result.content[0].text).length, 0);
    t.end();
});

test('local parse: schema has full field', (t) => {
    t.ok('full' in schema.shape);
    t.end();
});

test('local parse: default mode strips loc from AST', async (t) => {
    const result = await handler({
        source: 'const x = 1;',
    });
    
    const ast = JSON.parse(result.content[0].text);
    
    t.notOk('loc' in ast);
    t.end();
});

test('local parse: default mode keeps type', async (t) => {
    const result = await handler({
        source: 'const x = 1;',
    });
    
    const ast = JSON.parse(result.content[0].text);
    
    t.equal(ast.type, 'File');
    t.end();
});

test('local parse: default mode keeps start', async (t) => {
    const result = await handler({
        source: 'const x = 1;',
    });
    
    const ast = JSON.parse(result.content[0].text);
    
    t.equal(ast.start, 0);
    t.end();
});

test('local parse: full=true returns raw AST with loc', async (t) => {
    const result = await handler({
        source: 'const x = 1;',
        full: true,
    });
    
    const ast = JSON.parse(result.content[0].text);
    
    t.ok('loc' in ast);
    t.end();
});

test('local parse: full=false strips loc from AST', async (t) => {
    const result = await handler({
        source: 'const x = 1;',
        full: false,
    });
    
    const ast = JSON.parse(result.content[0].text);
    
    t.notOk('loc' in ast);
    t.end();
});

test('local parse: compact output is smaller than full output', async (t) => {
    const source = 'const x = 1;';
    
    const [compact] = await Promise.all([
        handler({
            source,
        }),
    ]);
    
    const full = await handler({
        source,
        full: true,
    });
    
    const result = compact.content[0].text.length < full.content[0].text.length;
    
    t.ok(result);
    t.end();
});

test('local parse: output is not pretty printed', async (t) => {
    const result = await handler({
        source: 'const x = 1;',
    });
    
    t.notMatch(result.content[0].text, '\n  ');
    t.end();
});
