import {test} from 'supertape';
import {
    SIGIL,
    addressed,
    prefixOf,
} from './sigil.ts';

/**
 * The whole module is three one-liners, and each of them exists because a
 * specific thing broke without it.
 */

test('sigil: the sigil is a slash', (t) => {
    const result = SIGIL;
    const expected = '/';
    
    t.equal(result, expected);
    t.end();
});

test('sigil: prefixOf strips a leading sigil', (t) => {
    const result = prefixOf('/ast');
    const expected = 'ast';
    
    t.equal(result, expected);
    t.end();
});

/**
 * The identity arm, and it is load-bearing rather than incidental: a recalled
 * line with `↑` and a pasted command both arrive with no sigil, and `Input`'s
 * autocomplete has to keep answering for them.
 */
test('sigil: prefixOf leaves a bare line alone', (t) => {
    const result = prefixOf('ast');
    const expected = 'ast';
    
    t.equal(result, expected);
    t.end();
});

/**
 * Only a **leading** sigil goes. `prefixOf` is used to decide whether a message
 * was the `help` command, so stripping a slash from the middle of a pasted
 * `source` body would let an unrelated line claim to be a command.
 */
test('sigil: prefixOf leaves a sigil inside the line alone', (t) => {
    const result = prefixOf('source\nconst a = "b/c";');
    const expected = 'source\nconst a = "b/c";';
    
    t.equal(result, expected);
    t.end();
});

test('sigil: a sigil-prefixed line is addressed', (t) => {
    const result = addressed('/ast');
    
    t.ok(result);
    t.end();
});

test('sigil: a bare line is not addressed', (t) => {
    const result = addressed('ast');
    
    t.notOk(result);
    t.end();
});

/**
 * An empty line is not addressed — there is no sigil on it.
 *
 * Which is **not** why the page does not reject it: `useChat` gates on
 * `line && !addressed(line)`, so a blank line falls through to `parseCommand`,
 * which answers `Empty command`. Writing this as `addressed('')` returning true
 * would have been the "fix" that made the gate swallow the parser's own error.
 */
test('sigil: an empty line carries no sigil', (t) => {
    const result = addressed('');
    
    t.notOk(result);
    t.end();
});
