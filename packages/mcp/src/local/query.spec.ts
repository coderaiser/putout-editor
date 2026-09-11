import {test} from 'supertape';
import {type ParserOptions, parse} from '@babel/parser';
import {queryAST} from './query.ts';

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
        'jsx',
        'typescript',
        'importMeta',
    ],
};

test('local query: finds VariableDeclaration nodes', (t) => {
    const source = 'var x = 1;';
    const ast = parse(source, parseOptions);
    const nodes = queryAST(ast, 'VariableDeclaration', source);
    
    t.equal(nodes[0].type, 'VariableDeclaration');
    t.end();
});

test('local query: returns empty array for no match', (t) => {
    const source = 'var x = 1;';
    const ast = parse(source, parseOptions);
    const result = queryAST(ast, 'FunctionDeclaration', source);
    const expected: unknown[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local query: trims and ignores empty types', (t) => {
    const source = 'var x = 1;';
    const ast = parse(source, parseOptions);
    const nodes = queryAST(ast, ' VariableDeclaration , ', source);
    
    t.equal(nodes[0].type, 'VariableDeclaration');
    t.end();
});

test('local query: sorts matches by start', (t) => {
    const source = 'var x = 1;\nvar y = 2;';
    const ast = parse(source, parseOptions);
    const nodes = queryAST(ast, 'VariableDeclaration', source);
    
    t.ok(nodes[0].start < nodes[1].start);
    t.end();
});

test('local query: includes source text of matched node', (t) => {
    const source = 'var x = 1;';
    const ast = parse(source, parseOptions);
    const nodes = queryAST(ast, 'VariableDeclaration', source);
    
    t.equal(nodes[0].text, 'var x = 1;');
    t.end();
});

test('local query: text matches slice of source by start and end', (t) => {
    const source = 'const a = 1; const b = 2;';
    const ast = parse(source, parseOptions);
    const nodes = queryAST(ast, 'VariableDeclaration', source);
    
    t.equal(nodes[1].text, 'const b = 2;');
    t.end();
});

test('local query: walks nested arrays', (t) => {
    const source = 'x';
    const ast = {
        body: [{
            type: 'Program',
            start: 0,
            end: 1,
            loc: {
                start: {
                    line: 1,
                    column: 0,
                },
                end: {
                    line: 1,
                    column: 1,
                },
            },
        }],
    };
    
    const nodes = queryAST(ast, 'Program', source);
    
    t.equal(nodes.length, 1);
    t.end();
});

test('local query: skips primitives and incomplete nodes', (t) => {
    const source = 'x';
    const ast = {
        junk: [{
            type: 'Program',
        }, null, 5, 'text'],
    };
    
    const result = queryAST(ast, 'Program', source);
    const expected: unknown[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
