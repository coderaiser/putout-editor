import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: CSS: removes vendor prefix', (t) => {
    const {code} = putout(fixtures.CSS, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.CSS)],
        ],
    });
    
    const expected = montag`
        // remove-vendor-prefix (CSS plugin)
        __putout_processor_css([
            declaration('user-select', 'none'),
        ]);
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: CSS: finds 1 place', (t) => {
    const {places} = putout(fixtures.CSS, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.CSS)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
