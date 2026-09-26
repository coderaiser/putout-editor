import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Traverser: merges duplicate imports', (t) => {
    const {code} = putout(fixtures.Traverser, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Traverser)],
        ],
    });
    
    const expected = montag`
        // merge-duplicate-imports
        // The plugin merges two imports from the same source into one.
        import {a, b} from 'x';
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: Traverser: finds 1 place', (t) => {
    const {places} = putout(fixtures.Traverser, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.Traverser)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
