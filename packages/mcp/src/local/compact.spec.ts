import {test} from 'supertape';
import {compactAST} from './compact.ts';

type Node = {
    type: string;
    start?: number;
    end?: number;
    [key: string]: unknown;
};

type File = Node & {
    program: Node & {
        body: Node[];
    };
};

const toFile = (ast: unknown) => compactAST(ast) as File;

test('compact: removes loc from nodes', (t) => {
    const input = {
        type: 'File',
        start: 0,
        end: 5,
        loc: {start: {line: 1, column: 0}, end: {line: 1, column: 5}},
        program: {
            type: 'Program',
            start: 0,
            end: 5,
            loc: {start: {line: 1, column: 0}, end: {line: 1, column: 5}},
            body: [],
        },
    };

    const result = toFile(input);

    t.notOk('loc' in result);
    t.end();
});

const nodeInput = {
    type: 'File',
    start: 0,
    end: 5,
    loc: {},
    program: {type: 'Program', start: 0, end: 5, body: []},
};

test('compact: keeps type', (t) => {
    const result = toFile(nodeInput);

    t.equal(result.type, 'File');
    t.end();
});

test('compact: keeps start', (t) => {
    const result = toFile(nodeInput);

    t.equal(result.start, 0);
    t.end();
});

test('compact: keeps end', (t) => {
    const result = toFile(nodeInput);

    t.equal(result.end, 5);
    t.end();
});

const noiseInput = {
    type: 'File',
    start: 0,
    end: 5,
    tokens: [{type: 'x'}],
    comments: [{value: 'hi'}],
    program: {type: 'Program', start: 0, end: 5, body: []},
};

test('compact: removes tokens', (t) => {
    const result = toFile(noiseInput);

    t.notOk('tokens' in result);
    t.end();
});

test('compact: removes comments', (t) => {
    const result = toFile(noiseInput);

    t.notOk('comments' in result);
    t.end();
});

test('compact: returns ast on error', (t) => {
    const input = null;
    const result = compactAST(input);

    t.equal(result, null);
    t.end();
});

const nestedInput = {
    type: 'File',
    start: 0,
    end: 10,
    loc: {start: {line: 1, column: 0}, end: {line: 1, column: 10}},
    program: {
        type: 'Program',
        start: 0,
        end: 10,
        loc: {start: {line: 1, column: 0}, end: {line: 1, column: 10}},
        body: [
            {
                type: 'VariableDeclaration',
                start: 6,
                end: 9,
                loc: {start: {line: 1, column: 6}, end: {line: 1, column: 9}},
                kind: 'const',
            },
        ],
    },
};

test('compact: strips loc from nested nodes', (t) => {
    const result = toFile(nestedInput);
    const [declaration] = result.program.body;

    t.notOk('loc' in declaration);
    t.end();
});

test('compact: keeps scalar keys of nested nodes', (t) => {
    const result = toFile(nestedInput);
    const [declaration] = result.program.body;

    t.equal(declaration.kind, 'const');
    t.end();
});

const untypedInput = {
    type: 'File',
    start: 0,
    end: 5,
    program: {
        type: 'Program',
        start: 0,
        end: 5,
        body: [
            {start: 0, end: 1},
            {type: 'EmptyStatement', start: 0, end: 1},
        ],
    },
};

test('compact: drops nodes without type', (t) => {
    const result = toFile(untypedInput);

    t.equal(result.program.body.length, 1);
    t.end();
});

test('compact: keeps the remaining node', (t) => {
    const result = toFile(untypedInput);
    const [statement] = result.program.body;

    t.equal(statement.type, 'EmptyStatement');
    t.end();
});
