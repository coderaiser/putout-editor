import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Markdown: removes trailing spaces from heading', (t) => {
    const {code} = putout(fixtures.Markdown, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Markdown)],
        ],
    });
    
    const expected = montag`
        // remove-trailing-spaces-from-heading (Markdown plugin)
        __putout_processor_markdown([
            heading(2, 'Hello World'),
        ]);
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: Markdown: finds 1 place', (t) => {
    const {places} = putout(fixtures.Markdown, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.Markdown)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
