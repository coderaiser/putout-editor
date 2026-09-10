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
    const ast = parse('var x = 1;', parseOptions);
    const nodes = queryAST(ast, 'VariableDeclaration');
    
    t.equal(nodes[0].type, 'VariableDeclaration');
    t.end();
});

test('local query: returns empty array for no match', (t) => {
    const ast = parse('var x = 1;', parseOptions);
    const result = queryAST(ast, 'FunctionDeclaration');
    const expected: unknown[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('local query: trims and ignores empty types', (t) => {
    const ast = parse('var x = 1;', parseOptions);
    const nodes = queryAST(ast, ' VariableDeclaration , ');
    
    t.equal(nodes[0].type, 'VariableDeclaration');
    t.end();
});

test('local query: sorts matches by start', (t) => {
    const ast = parse('var x = 1;\nvar y = 2;', parseOptions);
    const nodes = queryAST(ast, 'VariableDeclaration');
    
    t.ok(nodes[0].start < nodes[1].start);
    t.end();
});

test('local query: walks nested arrays', (t) => {
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
    
    const nodes = queryAST(ast, 'Program');
    
    t.equal(nodes.length, 1);
    t.end();
});

test('local query: skips primitives and incomplete nodes', (t) => {
    const ast = {
        junk: [{
            type: 'Program',
        }, null, 5, 'text'],
    };
    
    const result = queryAST(ast, 'Program');
    const expected: unknown[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});
