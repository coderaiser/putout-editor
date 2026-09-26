import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Finder: removes the duplicate declaration', (t) => {
    const {code} = putout(fixtures.Finder, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Finder)],
        ],
    });
    
    const expected = montag`
        // find-duplicate-values
        // The plugin finds variables whose initialiser is an identical literal.
        const x = 1;
        
        const z = 2;
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: Finder: finds 1 place', (t) => {
    const {places} = putout(fixtures.Finder, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.Finder)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
