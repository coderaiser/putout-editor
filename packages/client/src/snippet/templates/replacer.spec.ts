import {test} from 'supertape';
import {montag} from 'montag';
import {putout} from 'putout';
import {initPlugin} from '#transformer/init-plugin';
import {fixtures, templates} from './index.ts';

test('templates: Replacer: transforms ternary into if statement', (t) => {
    const {code} = putout(fixtures.Replacer, {
        fixCount: 1,
        plugins: [
            ['rule', initPlugin(templates.Replacer)],
        ],
    });
    
    const expected = montag`
        // convert-ternary-to-if
        /**
         * Paste or drop some JavaScript here and explore
         * the syntax tree created by chosen parser 🎁.
         *
         * You can use all the cool new features from ES2026
         * and even more. Enjoy 🎈!
         */
        if ('Transform your code with 🐊Putout')
            console.log('Codemods never been as simple 🎈');
        else
            console.log('🥵');
    
    `;
    
    t.equal(code, expected);
    t.end();
});

