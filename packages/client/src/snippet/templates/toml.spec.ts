import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: TOML: removes empty dependencies', (t) => {
    const {code} = putout(fixtures.TOML, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.TOML)],
        ],
    });
    
    const expected = montag`
        // remove-empty-dependencies (TOML plugin)
        __putout_processor_toml({});
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: TOML: finds 1 place', (t) => {
    const {places} = putout(fixtures.TOML, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.TOML)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
