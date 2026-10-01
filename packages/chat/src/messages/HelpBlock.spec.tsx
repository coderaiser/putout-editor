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

test('HelpBlock: names every command with a slash', (t) => {
    render(
        <HelpBlock/>,
    );
    
    const result = textsOf('.help-block__name');
    
    // The `for..of` rather than `.map()` is `for-of/map`, and the type is
    // written out rather than inferred: a bare `[]` gives `tape`'s
    // `extract-result-from-assertion` nothing to hoist.
    const expected: string[] = [];
    
    for (const name of commands.keys())
        expected.push(`/${name}`);
    
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
