import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {commands} from '@putout/editor-commands';
import {textsOf} from '../../test/dom.ts';
import HelpBlock from './HelpBlock.tsx';

test('HelpBlock: renders a row per command', (t) => {
    render(
        <HelpBlock/>,
    );
    
    const result = document.querySelectorAll('.help-block__row').length;
    const expected = commands.size;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('HelpBlock: names every command', (t) => {
    render(
        <HelpBlock/>,
    );
    
    const result = textsOf('.help-block__name');
    
    // The `for..of` rather than `.map()` is `for-of/map`, and the type is
    // written out rather than inferred: a bare `[]` gives `tape`'s
    // `extract-result-from-assertion` nothing to hoist.
    const expected: string[] = [];
    
    // The `for..of` rather than `.map()` is `for-of/map`, and the type is
    // written out rather than inferred: a bare `[]` gives `tape`'s
    // `extract-result-from-assertion` nothing to hoist.
    //
    // Built from the registry's own `name` and `usage` rather than written out
    // here, so this pins the *shape* — every command, in registry order,
    // carrying its usage — and not a transcription of it that could pass while
    // the component printed something else.
    for (const {name, usage} of commands.values())
        expected.push(`/${name} ${usage}`);
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});

test('HelpBlock: shows the description of each command', (t) => {
    render(
        <HelpBlock/>,
    );
    
    const source = commands.get('source');
    const first = document.querySelector('.help-block__description');
    const result = first && first.textContent;
    const expected = source && source.description;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The usage, which is the whole reason the table exists.
 *
 * Before this the row was `name` and `description`, and `source` said "set the
 * source every other command reads" without ever saying that it *takes* a
 * source. `help` in the text form does; the table did not, so the two answers
 * to `help` would have disagreed. `plan.md` asks for `source [source]` to be
 * visible, and this is that row.
 */
test('HelpBlock: shows the usage beside each name', (t) => {
    render(
        <HelpBlock/>,
    );
    
    const first = document.querySelector('.help-block__name');
    const source = commands.get('source');
    const result = first && first.textContent;
    const expected = source && `/${source.name} ${source.usage}`;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * A command that takes nothing still prints its brackets.
 *
 * `clear` and `help` write `usage: '[]'` rather than an empty string, so a row
 * is never ambiguous about whether the brackets were forgotten or the command
 * genuinely takes no input. This is the check that the empty case is not
 * quietly rendered as an empty cell.
 */
test('HelpBlock: a command that takes nothing still shows its brackets', (t) => {
    render(
        <HelpBlock/>,
    );
    
    const names = textsOf('.help-block__name');
    const result = names.includes('/help []');
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * Every row carries the sigil, so the table teaches lines the page runs.
 *
 * The negated filter rather than a positive check: asserting slashed rows
 * exist passes on a half-slashed table, while `!startsWith('/')` failing on
 * the first bare row catches one `name usage` left behind in eleven.
 */
test('HelpBlock: every row starts with a slash', (t) => {
    render(
        <HelpBlock/>,
    );
    
    const names = textsOf('.help-block__name');
    const result = names.filter((name) => !name.startsWith('/'));
    const expected: string[] = [];
    
    cleanup();
    
    t.deepEqual(result, expected);
    t.end();
});
