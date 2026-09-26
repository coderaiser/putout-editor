import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Ignore: fixes the lock file extension', (t) => {
    const {code} = putout(fixtures.Ignore, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Ignore)],
        ],
    });
    
    const expected = montag`
        // fix-lock-extension (.gitignore plugin)
        __putout_processor_ignore(["*.lock", "node_modules"]);
    `;
    
    const result = code.trimEnd();
    
    t.equal(result, expected);
    t.end();
});

test('templates: Ignore: finds 1 place', (t) => {
    const {places} = putout(fixtures.Ignore, {
        fix: false,
        plugins: [
            ['rule', initPlugin(templates.Ignore)],
        ],
    });
    
    t.equal(places.length, 1);
    t.end();
});
