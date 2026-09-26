import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Scanner: keeps only the transformation result', (t) => {
    const {code} = putout(fixtures.Scanner, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Scanner)],
        ],
    });
    
    const expected = montag`
        __putout_processor_filesystem([
            "/",
            "/index.js",
            "/utils.js"
        ]);
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: Scanner: finds 1 place', (t) => {
    const {places} = putout(fixtures.Scanner, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.Scanner)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
