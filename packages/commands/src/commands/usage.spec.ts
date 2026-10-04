import {test} from 'supertape';
import {commands} from './index.ts';
import {runHelp} from '../index.ts';

/**
 * The `help` rows, as text.
 *
 * Both arms need narrowing and neither is a cast. `runHelp` is declared to
 * return the whole `CommandResult` union — the command modules are typed by
 * what they answer *with*, not by one shape — and the union has an `ast` arm
 * with no `data` at all, so `tsc` cannot let `.data` through until `type` has
 * been checked. Same for `Command.run`, which is a promise *or* a result
 * because three commands reach 🐊Putout; `help` is not one of them, so this
 * refuses the promise rather than awaiting it.
 */
const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';
const isString = (a: unknown): a is string => typeof a === 'string';

/**
 * The `help` rows, as text.
 *
 * Both arms need narrowing and neither is a cast. `runHelp` is declared to
 * return the whole `CommandResult` union — the command modules are typed by
 * what they answer *with*, not by one shape — and the union has an `ast` arm
 * with no `data` at all, so `tsc` cannot let `.data` through until `type` has
 * been checked. Same for `Command.run`, which is a promise *or* a result
 * because three commands reach 🐊Putout; `help` is not one of them, so this
 * refuses the promise rather than awaiting it.
 */
const rows = (): string[] => {
    const result = runHelp([...commands.values()]);
    
    return result.type === 'text' ? result.data
        .split('\n')
        .filter(Boolean) : [];
};

const helpText = (): string => rows().join('\n');

test('index: every command declares the input it takes', (t) => {
    const missing = [...commands.keys()].filter((name) => {
        const {usage} = commands.get(name) || {};
        
        return !isString(usage) || !usage.length;
    });
    
    const expected: string[] = [];
    
    t.deepEqual(missing, expected);
    t.end();
});

test('index: help prints the usage beside the name', (t) => {
    const result = helpText()
        .split('\n')
        .find((line) => line.startsWith('source'));
    
    const expected = 'source [source]';
    
    t.ok(result && result.startsWith(expected));
    t.end();
});

test('index: help prints a command that takes nothing as the name alone', (t) => {
    const row = helpText()
        .split('\n')
        .find((line) => line.startsWith('help '));
    
    // `help []` and the gap after it: the brackets say "takes nothing" rather
    // than being absent, so a row is never ambiguous about a forgotten usage.
    const result = isUndefined(row) ? '' : row.slice(0, 'help [] '.length);
    const expected = 'help [] ';
    
    t.equal(result, expected);
    t.end();
});

test('index: help names every command without a slash', (t) => {
    const slashes = helpText()
        .split('\n')
        .filter((line) => line.startsWith('/'));
    
    const expected: string[] = [];
    
    t.deepEqual(slashes, expected);
    t.end();
});

test('index: runHelp and the registry agree on the rows', (t) => {
    const result = rows().length;
    const expected = commands.size;
    
    t.equal(result, expected);
    t.end();
});

/**
 * The descriptions share a column.
 *
 * Measured rather than asserted from the source: the column is the *last* run of
 * two or more spaces on the line, so a row whose usage is wider than the widest
 * one shows up as a different number instead of as a string that happens to
 * look right. One distinct value means every description starts in one place.
 */
test('index: help pads every description into one column', (t) => {
    const columns = rows().map((line: string) => {
        const gap = line.match(/\S\s{2,}\S*$/);
        
        return gap ? gap.index! + gap[0].indexOf('\n') : -1;
    });
    
    const result = [...new Set(columns)];
    const expected = [columns[0]];
    
    t.deepEqual(result, expected);
    t.end();
});
