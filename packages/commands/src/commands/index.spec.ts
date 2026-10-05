import {test, stub} from 'supertape';
import {
    commands,
    notInBrowser,
    needsPutout,
} from './index.ts';
import type {Command} from '../state.types.ts';

test('index: every key equals its own command name', (t) => {
    const expected: string[] = [];
    
    for (const [key, {name}] of commands)
        expected.push(`${key}:${name}`);
    
    const result = expected.filter((pair) => {
        const [key, name] = pair.split(':');
        
        return key !== name;
    });
    
    t.deepEqual(result, []);
    t.end();
});

test('index: every command has a name, a usage, a description, flags and run', (t) => {
    const missing: string[] = [];
    
    for (const [name, command] of commands) {
        if (!command.name || !command.usage || !command.description || !command.run)
            missing.push(name);
    }
    
    const result = missing;
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The count is a regression check on `help` alone: `help` is built from the
 * same list the map is, so dropping a command entirely shrinks both sides and
 * this still passes. What it catches is a command added to the map whose row
 * never reaches the help text.
 */
test('index: help lists every command in the map', (t) => {
    const expected = commands.size;
    
    t.equal(linesOf(runHelp()).length, expected);
    t.end();
});

test('index: help names every command', (t) => {
    const data = dataOf(runHelp());
    const result = [...commands.keys()].filter((name) => !data.includes(`/${name} `));
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

const runHelp = () => {
    const result = commands.get('help');
    
    return result && result.run('', {
        source: '',
        plugin: '',
    });
};

const isText = (value: unknown): value is {
    type: 'text';
    data: string;
} => value !== null && typeof value === 'object' && 'data' in value;

const dataOf = (result: unknown) => isText(result) ? result.data : '';

const linesOf = (result: unknown) => dataOf(result)
    .split('\n')
    .filter(Boolean);

/** The `message` of an error-shaped result, or nothing. */
const isError = (value: unknown): value is {
    type: 'error';
    message: string;
} => value !== null && typeof value === 'object' && 'message' in value;

const messageOf = (result: unknown) => isError(result) ? result.message : '';

/**
 * `find`, `transform` and `validate` reach 🐊**Putout** through a dynamic
 * `import()`, and in a browser bundle that chunk is never fetched. The loader can
 * fail, and the answer has to be an error a user can read rather than an
 * unhandled rejection — this is the only thing standing between a failed chunk
 * and a blank input box.
 */
test('index: a putout command that cannot load says so instead of throwing', (t) => {
    const result = notInBrowser('validate');
    
    t.equal(result.type, 'error');
    t.end();
});

test('index: notInBrowser names the command it could not run', (t) => {
    const result = notInBrowser('find');
    const expected = 'find needs the putout server and does not run in the browser.';
    
    t.equal(messageOf(result), expected);
    t.end();
});

test('index: a loader that throws answers with notInBrowser', async (t) => {
    const state = {
        source: '',
        plugin: '',
    };
    
    const run = needsPutout('find', 'runFind', stub().rejects(Error('chunk 404')));
    
    const result = await run('', state);
    
    t.equal(result.type, 'error');
    t.end();
});

test('index: a loader that resolves without the export answers with notInBrowser', async (t) => {
    const state = {
        source: '',
        plugin: '',
    };
    
    const run = needsPutout('find', 'runFind', stub().resolves({}));
    const result = await run('', state);
    
    t.equal(result.type, 'error');
    t.end();
});

test('index: a loader that resolves with the export runs it', async (t) => {
    const state = {
        source: '',
        plugin: '',
    };
    
    const run = needsPutout('find', 'runFind', stub().resolves({
        runFind: () => ({
            type: 'text' as const,
            data: 'ran',
        }),
    }));
    
    const result = await run('', state);
    
    t.equal(result.type, 'text');
    t.end();
});

test('index: an unknown command is not in the map', (t) => {
    const result = [...commands.keys()].includes('notacommand');
    
    t.notOk(result);
    t.end();
});

/**
 * Every `run` is called here, which is what puts `source`, `ast`, `find`,
 * `transform`, `validate`, `test-pattern`, `name-pattern`, `console`, `clear`,
 * `reset` and `help` in the function coverage — a registry entry nobody ever
 * calls is a registry entry nobody has tested.
 */
test('index: every run answers without throwing', async (t) => {
    const answers = await Promise.all([...commands.values()].map(answer));
    
    t.equal(answers.length, commands.size);
    t.end();
});

const answer = ({run}: Command) => Promise.resolve(run('', {
    source: 'const a = 1;',
    plugin: '',
}));
