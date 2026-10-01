import {test} from 'supertape';
import {parseCommand} from './parse.ts';

test('parse: a bare slash is help', (t) => {
    const result = parseCommand('/');
    const expected = {
        command: 'help',
        args: '',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a command with no argument', (t) => {
    const result = parseCommand('/ast');
    const expected = {
        command: 'ast',
        args: '',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a boolean flag', (t) => {
    const result = parseCommand('/ast --full');
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
    const result = parseCommand('/ast --query VariableDeclaration');
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
    const result = parseCommand('/ast --nope');
    const expected = {
        command: 'ast',
        args: '',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a quoted argument keeps its spaces', (t) => {
    const result = parseCommand('/source "const a = 1;"');
    const expected = {
        command: 'source',
        args: 'const a = 1;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a single-quoted argument keeps its spaces', (t) => {
    const result = parseCommand('/source \'const a = 1;\'');
    const expected = {
        command: 'source',
        args: 'const a = 1;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: mismatched quotes are left alone', (t) => {
    const result = parseCommand('/source "const a = 1;\'');
    const expected = {
        command: 'source',
        args: '"const a = 1;\'',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: inline code after the command is the argument', (t) => {
    const result = parseCommand('/source const a = 1;');
    const expected = {
        command: 'source',
        args: 'const a = 1;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: everything after the first newline is the body', (t) => {
    const result = parseCommand('/source\nconst a = 1;\nconst b = 2;');
    const expected = {
        command: 'source',
        args: 'const a = 1;\nconst b = 2;',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a body stops at the next command', (t) => {
    const result = parseCommand('/source\nconst a = 1;\n/ast');
    const expected = {
        command: 'source',
        args: 'const a = 1;',
        flags: {},
        rest: '/ast',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a multiline plugin body is kept whole', (t) => {
    const result = parseCommand('/find\nexport const report = () => "z";\nexport const replace = () => ({});');
    const expected = {
        command: 'find',
        args: 'export const report = () => "z";\nexport const replace = () => ({});',
        flags: {},
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a bare word is an error result', (t) => {
    const result = parseCommand('hello');
    const expected = {
        error: 'Not a command: hello',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: empty input is an error result', (t) => {
    const result = parseCommand('');
    const expected = {
        error: 'Empty command',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: whitespace only is an error result', (t) => {
    const result = parseCommand('   \n  ');
    const expected = {
        error: 'Empty command',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: text that is not a command is an error result', (t) => {
    const result = parseCommand('what does this do?');
    const expected = {
        error: 'Not a command: what does this do?',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parse: a command may be preceded by whitespace', (t) => {
    const result = parseCommand('  /ast --full');
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
