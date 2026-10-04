import {test} from 'supertape';
import {runAst} from './ast.ts';

const noFlags = {};

const withSource = (source: string) => ({
    source,
    plugin: '',
});

test('ast: no source is an error', (t) => {
    const result = runAst(noFlags, withSource(''));
    const expected = {
        type: 'error',
        message: 'No source. Use source first.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('ast: returns the rows and the source', (t) => {
    const result = runAst(noFlags, withSource('const a = 1;'));
    const expected = 'ast';
    
    t.equal(result.type, expected);
    t.end();
});

test('ast: the first row is Program at depth 0', (t) => {
    const result = runAst(noFlags, withSource('const a = 1;'));
    const expected = 0;
    
    t.equal(result.type === 'ast' && result.nodes[0].depth, expected);
    t.end();
});

test('ast: the source travels with the rows', (t) => {
    const result = runAst(noFlags, withSource('const a = 1;'));
    const expected = 'const a = 1;';
    
    t.equal(result.type === 'ast' && result.source, expected);
    t.end();
});

test('ast: unparsable source is an error', (t) => {
    const result = runAst(noFlags, withSource('const = ;'));
    const expected = 'error';
    
    t.equal(result.type, expected);
    t.end();
});

test('ast: --query narrows to positions', (t) => {
    const result = runAst({
        query: 'VariableDeclaration',
    }, withSource('const a = 1;'));
    
    const expected = 'VariableDeclaration at 1:0';
    
    t.equal(result.type === 'text' && result.data, expected);
    t.end();
});
