import {test} from 'supertape';
import {parse} from '@babel/parser';
import {compactAST} from './compact.ts';

const parseSource = (source: string) => parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
});

test('compact: removes loc from nodes', (t) => {
    const ast = parseSource('const x = 1;');
    const result = compactAST(ast) as Record<string, unknown>;
    
    t.notOk(result.loc);
    t.end();
});

test('compact: removes tokens', (t) => {
    const ast = parseSource('const x = 1;');
    const result = compactAST(ast) as Record<string, unknown>;
    
    t.notOk(result.tokens);
    t.end();
});

test('compact: removes comments', (t) => {
    const ast = parseSource('// comment\nconst x = 1;');
    const result = compactAST(ast) as Record<string, unknown>;
    
    t.notOk(result.comments);
    t.end();
});

test('compact: keeps type field', (t) => {
    const ast = parseSource('const x = 1;');
    const result = compactAST(ast) as Record<string, unknown>;
    
    t.equal(result.type, 'File');
    t.end();
});

test('compact: keeps start field', (t) => {
    const ast = parseSource('const x = 1;');
    const result = compactAST(ast) as Record<string, unknown>;
    
    t.equal(result.start, 0);
    t.end();
});

test('compact: keeps end field', (t) => {
    const ast = parseSource('const x = 1;');
    const result = compactAST(ast) as Record<string, unknown>;
    
    t.equal(result.end, 12);
    t.end();
});

test('compact: keeps program child', (t) => {
    const ast = parseSource('const x = 1;');
    const result = compactAST(ast) as {
        program: unknown;
    };
    
    t.ok(result.program);
    t.end();
});

test('compact: result is smaller than full AST', (t) => {
    const ast = parseSource('const x = 1;\nvar y = foo();\nlet z = "hello";');
    const full = JSON.stringify(ast).length;
    const compacted = JSON.stringify(compactAST(ast)).length;
    
    t.ok(compacted < full);
    t.end();
});

test('compact: handles null input gracefully', (t) => {
    const result = compactAST(null);
    
    t.notOk(result);
    t.end();
});

test('compact: handles non-object input', (t) => {
    const result = compactAST('string');
    
    t.equal(result, 'string');
    t.end();
});

test('compact: handles array of nodes', (t) => {
    const ast = parseSource('[1, 2, 3];');
    const result = compactAST(ast);
    
    t.ok(result);
    t.end();
});

test('compact: strips extra field', (t) => {
    const ast = parseSource('42;');
    const result = compactAST(ast) as Record<string, unknown>;
    const program = result.program as Record<string, unknown>;
    const body = program.body as Record<string, unknown>[];
    const stmt = body[0] as Record<string, unknown>;
    const expr = stmt.expression as Record<string, unknown>;
    
    t.notOk(expr.extra);
    t.end();
});

test('compact: drops object without type', (t) => {
    const result = compactAST({
        loc: 'dropped',
    });
    
    t.notOk(result);
    t.end();
});

test('compact: returns original ast when compaction fails', (t) => {
    const ast = {
        type: 'File',
        program: {
            type: 'Program',
            get body() {
                throw Error('boom');
            },
        },
    };
    
    const result = compactAST(ast);
    
    t.equal(result, ast);
    t.end();
});
