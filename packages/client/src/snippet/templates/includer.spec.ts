import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Includer: removes empty method', (t) => {
    const {code} = putout(fixtures.Includer, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Includer)],
        ],
    });
    
    const expected = montag`
        // remove-empty-method
        // The plugin removes methods with no params and no body.
        const obj = {
            greetWithName(name) {
                return \`hello \${name}\`;
            },
        };
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: Includer: finds 1 place', (t) => {
    const {places} = putout(fixtures.Includer, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.Includer)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
