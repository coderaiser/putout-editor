import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: JSON: removes duplicate keyword', (t) => {
    const {code} = putout(fixtures.JSON, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.JSON)],
        ],
    });
    
    const expected = montag`
        // remove-duplicate-keywords (package.json plugin)
        // The JSON processor wraps package.json fields as a function call.
        __putout_processor_json({
            "keywords": ["putout", "codemod"]
        });
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: JSON: finds 1 place', (t) => {
    const {places} = putout(fixtures.JSON, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.JSON)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
