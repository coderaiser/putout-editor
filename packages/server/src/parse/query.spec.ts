import {test} from 'supertape';
import {parse} from '@babel/parser';
import {queryAST} from './query.ts';

const parseSource = (source: string) => parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
});

test('query: returns array', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.ok(Array.isArray(result));
    t.end();
});

test('query: finds one VariableDeclaration', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.equal(result.length, 1);
    t.end();
});

test('query: finds two VariableDeclarations', (t) => {
    const ast = parseSource('var x = 1;\nconst y = 2;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.equal(result.length, 2);
    t.end();
});

test('query: result has type field', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.equal(result[0].type, 'VariableDeclaration');
    t.end();
});

test('query: result has start field', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.equal(result[0].start, 0);
    t.end();
});

test('query: result has end field', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.equal(result[0].end, 10);
    t.end();
});

test('query: result has loc with start line', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.equal(result[0].loc.start.line, 1);
    t.end();
});

test('query: result has loc with start column', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.equal(result[0].loc.start.column, 0);
    t.end();
});

test('query: result has loc with end line', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration');
    
    t.equal(result[0].loc.end.line, 1);
    t.end();
});

test('query: returns empty array when no match', (t) => {
    const ast = parseSource('const x = 1;');
    const result = queryAST(ast, 'FunctionDeclaration');
    
    t.equal(result.length, 0);
    t.end();
});

test('query: comma-separated types finds both', (t) => {
    const ast = parseSource('var x = 1;\nfunction foo() {}');
    const result = queryAST(ast, 'VariableDeclaration,FunctionDeclaration');
    
    t.equal(result.length, 2);
    t.end();
});

test('query: comma-separated results sorted by start', (t) => {
    const ast = parseSource('var x = 1;\nfunction foo() {}');
    const result = queryAST(ast, 'VariableDeclaration,FunctionDeclaration');
    
    t.ok(result[0].start < result[1].start);
    t.end();
});

test('query: handles whitespace in comma-separated types', (t) => {
    const ast = parseSource('var x = 1;');
    const result = queryAST(ast, 'VariableDeclaration , Identifier');
    
    t.ok(result.length > 0);
    t.end();
});

test('query: returns empty array for unknown node type', (t) => {
    const ast = parseSource('const x = 1;');
    const result = queryAST(ast, 'UnknownNodeType');
    
    t.equal(result.length, 0);
    t.end();
});

test('query: empty string returns empty array', (t) => {
    const ast = parseSource('const x = 1;');
    const result = queryAST(ast, '');
    
    t.equal(result.length, 0);
    t.end();
});

test('query: Identifier finds identifiers', (t) => {
    const ast = parseSource('const myVariable = 1;');
    const result = queryAST(ast, 'Identifier');
    
    t.ok(result.length > 0);
    t.end();
});
