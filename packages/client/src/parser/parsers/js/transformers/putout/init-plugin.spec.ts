import {test} from 'supertape';
import {initPlugin} from './init-plugin.ts';

const noop = () => {};

test('putout-editor: client: parsers: putout: initPlugin: report', (t) => {
    const {report} = initPlugin(`
        export const replace = () => ({
            'const __a = 3': (vars, path) => {
                return typeof putout;
            }
        });
    `);
    
    t.deepEqual(report, noop);
    t.end();
});

test('putout-editor: client: parsers: putout: initPlugin: putout', (t) => {
    const {replace} = initPlugin(`
        export const replace = () => ({
            'const __a = 3': (vars, path) => {
                return typeof putout;
            }
        });
    `);
    
    // @ts-expect-error replace not typed
    const result = replace()['const __a = 3']();
    
    t.equal(result, 'function');
    t.end();
});
