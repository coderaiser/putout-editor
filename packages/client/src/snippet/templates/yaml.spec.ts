import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: YAML: removes empty needs', (t) => {
    const {code} = putout(fixtures.YAML, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.YAML)],
        ],
    });
    
    const expected = montag`
        // remove-empty-needs (GitHub Actions YAML plugin)
        __putout_processor_yaml({
            "jobs": {
                "build": {
                    "runs-on": "ubuntu-latest"
                }
            }
        });
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: YAML: finds 1 place', (t) => {
    const {places} = putout(fixtures.YAML, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.YAML)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
