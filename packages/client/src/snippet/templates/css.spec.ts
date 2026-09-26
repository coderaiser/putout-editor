import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: CSS: replaces rgb with a var reference', (t) => {
    const {code} = putout(fixtures.CSS, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.CSS)],
        ],
    });
    
    const expected = montag`
        // convert-rgb-to-var (CSS plugin)
        // The CSS processor wraps declarations as function calls, so a literal color
        // shows up as functionValue("rgb", ...).
        __putout_processor_css([
            rule(selector([
                classSelector('hello'),
            ]), [
                declaration('box-shadow', valueList([
                    0,
                    dimension(-4, 'px'),
                    dimension(16, 'px'),
                    functionValue('var', ['--shadow-color']),
                ])),
            ]),
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
