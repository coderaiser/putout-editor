import {test} from 'supertape';
import {learnCommand, runLearn} from './index.ts';
import {curriculum, learnNodes} from './curriculum.ts';
import type {CommandResult} from '../state.types.ts';

/**
 * `runLearn` is a constant, so what is worth testing is that the *registry
 * entry* is what the plan says it is: a command named `learn`, taking nothing,
 * whose `run` answers with the tree. A handler that returned the wrong arm would
 * still compile and would render nothing at all in the thread.
 */
const result = runLearn() as Extract<CommandResult, {type: 'learn'}>;

test('runLearn: answers with the learn arm', (t) => {
    const answer = result.type;
    const expected = 'learn';
    
    t.equal(answer, expected);
    t.end();
});

test('runLearn: the tree is a non-empty array', (t) => {
    const answer = Array.isArray(result.tree) && result.tree.length > 0;
    
    t.ok(answer);
    t.end();
});

test('runLearn: each top-level node has an id and a label', (t) => {
    const answer = result.tree
        .filter(({id, label}) => !id || !label)
        .map(({id}) => id);
    
    const expected: string[] = [];
    
    t.deepEqual(answer, expected);
    t.end();
});

/**
 * The tree is the curriculum **itself**, not a copy.
 *
 * `===` rather than `deepEqual`: the command runs on every `/learn`, and a copy
 * would mean re-serialising twenty-odd nodes of prose per keystroke of a command
 * that cannot produce a different answer. It also means the chat and the mcp
 * read one object, so a curriculum edit reaches both.
 */
test('runLearn: answers with the curriculum itself', (t) => {
    const answer = result.tree === curriculum;
    
    t.ok(answer);
    t.end();
});

/**
 * Children are nested, not flattened.
 *
 * `LearnTree` flattens client-side, so a top-level node with no `children` would
 * render a single unexpandable row and the whole tree would be unreachable.
 */
test('runLearn: top-level nodes carry their children', (t) => {
    const answer = result.tree.every(({children}) => Boolean(children && children.length));
    
    t.ok(answer);
    t.end();
});

/**
 * The registry entry tolerates the arguments it is handed.
 *
 * `Command.run` is `(args, state)`, so the registry calls every entry with both
 * whether or not it declares them — and `/learn foo` is a thing a user types.
 * Tested through `learnCommand.run` rather than `runLearn` directly: the latter
 * takes no parameters, and `tsc` rightly refuses to invent two, which is the
 * point. What a user reaches is the registry entry.
 */
test('learnCommand: run ignores the args and state it is handed', (t) => {
    const withArgs = learnCommand.run('anything', {
        source: 'const a = 1;',
        plugin: '',
    }) as Extract<CommandResult, {type: 'learn'}>;
    
    const answer = withArgs.tree === result.tree;
    
    t.ok(answer);
    t.end();
});

test('learnCommand: is named learn', (t) => {
    const answer = learnCommand.name;
    const expected = 'learn';
    
    t.equal(answer, expected);
    t.end();
});

/**
 * `usage: '[]'` rather than an empty string.
 *
 * `help` prints `/${name} ${usage}`, so a missing usage gives `/learn ` with a
 * trailing space and no way for a reader to tell it apart from a command whose
 * usage was simply forgotten.
 */
test('learnCommand: declares that it takes nothing', (t) => {
    const answer = learnCommand.usage;
    const expected = '[]';
    
    t.equal(answer, expected);
    t.end();
});

test('learnCommand: has a description and no flags', (t) => {
    const answer = {
        described: Boolean(learnCommand.description),
        flags: learnCommand.flags,
    };
    
    const expected = {
        described: true,
        flags: [],
    };
    
    t.deepEqual(answer, expected);
    t.end();
});

/**
 * The registry entry's `run` is the exported handler, not a wrapper.
 *
 * A separate arrow would be one more place for the two to diverge, and
 * `commands/index.spec.ts` calls every entry's `run` — so this is the line that
 * puts `runLearn` into the function coverage rather than only its spec.
 */
test('learnCommand: runs runLearn', (t) => {
    const answer = learnCommand.run === runLearn;
    
    t.ok(answer);
    t.end();
});

test('learnCommand: answers with every curriculum node reachable', (t) => {
    const listed = runLearn() as Extract<CommandResult, {type: 'learn'}>;
    
    const answer = learnNodes(listed.tree).length;
    const expected = learnNodes(curriculum).length;
    
    t.equal(answer, expected);
    t.end();
});
