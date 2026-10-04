import {test} from 'supertape';
import {parseCommand} from './parse.ts';

const names = [
    'source',
    'ast',
    'help',
];

test('parse: a command is its first word', (t) => {
    const result = parseCommand('ast', names);
    const expected = {
        command: 'ast',
        args: '',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a bare word is a command name, not an error', (t) => {
    const result = parseCommand('hello', names);
    const expected = {
        command: 'hello',
        args: '',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a slash is part of the word, so it names no command', (t) => {
    const result = parseCommand('/ast', names);
    const expected = {
        command: '/ast',
        args: '',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a boolean flag', (t) => {
    const result = parseCommand('ast --full', names);
    const expected = {
        command: 'ast',
        args: '',
        flags: {
            full: true,
        },
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a flag with a value', (t) => {
    const result = parseCommand('ast --query VariableDeclaration', names);
    const expected = {
        command: 'ast',
        args: '',
        flags: {
            query: 'VariableDeclaration',
        },
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: an unknown flag is ignored, not an error', (t) => {
    const result = parseCommand('ast --nope', names);
    const expected = {
        command: 'ast',
        args: '',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a quoted argument keeps its spaces', (t) => {
    const result = parseCommand('source "const a = 1;"', names);
    const expected = {
        command: 'source',
        args: 'const a = 1;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a single-quoted argument keeps its spaces', (t) => {
    const result = parseCommand('source \'const a = 1;\'', names);
    const expected = {
        command: 'source',
        args: 'const a = 1;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: mismatched quotes are left alone', (t) => {
    const result = parseCommand('source "const a = 1;\'', names);
    const expected = {
        command: 'source',
        args: '"const a = 1;\'',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: inline code after the command is the argument', (t) => {
    const result = parseCommand('source const a = 1;', names);
    const expected = {
        command: 'source',
        args: 'const a = 1;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: everything after the first newline is the body', (t) => {
    const result = parseCommand('source\nconst a = 1;\nconst b = 2;', names);
    const expected = {
        command: 'source',
        args: 'const a = 1;\nconst b = 2;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a body stops at the next known command', (t) => {
    const result = parseCommand('source\nconst a = 1;\nast', names);
    const expected = {
        command: 'source',
        args: 'const a = 1;',
        flags: {},
        rest: 'ast',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: with no known commands a body runs to the end', (t) => {
    const result = parseCommand('source\nconst a = 1;\nast');
    const expected = {
        command: 'source',
        args: 'const a = 1;\nast',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a line that merely starts with a command word is body', (t) => {
    const result = parseCommand('source\nast();\nconst b = 2;', names);
    const expected = {
        command: 'source',
        args: 'ast();\nconst b = 2;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a multiline plugin body is kept whole', (t) => {
    const result = parseCommand('find\nexport const report = () => "z";\nexport const replace = () => ({});', names);
    const expected = {
        command: 'find',
        args: 'export const report = () => "z";\nexport const replace = () => ({});',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: empty input is an error result', (t) => {
    const result = parseCommand('', names);
    const expected = {
        error: 'Empty command',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: whitespace only is an error result', (t) => {
    const result = parseCommand('   \n  ', names);
    const expected = {
        error: 'Empty command',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a command may be preceded by whitespace', (t) => {
    const result = parseCommand('  ast --full', names);
    const expected = {
        command: 'ast',
        args: '',
        flags: {
            full: true,
        },
    };
    
    t.deepEqual(result, expected);
    t.end();
});
