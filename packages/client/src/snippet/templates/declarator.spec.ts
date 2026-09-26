import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Declarator: inserts missing putout import', (t) => {
    const {code} = putout(fixtures.Declarator, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Declarator)],
        ],
    });
    
    const expected = montag`
        import putout from 'putout';
        
        // declare-putout-imports
        // The plugin auto-inserts missing imports for putout/operator/types.
        const {code} = putout(source, {
            plugins: [],
        });
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: Declarator: finds 1 place', (t) => {
    const {places} = putout(fixtures.Declarator, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.Declarator)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
