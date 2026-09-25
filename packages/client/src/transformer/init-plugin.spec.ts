import {test} from 'supertape';
import {type Replacer} from 'putout';
import {initPlugin} from '#transformer/init-plugin';

const noop = () => {};

test('putout-editor: client: parsers: putout: initPlugin: no report', (t) => {
    const {report} = initPlugin(`
        export const replace = () => ({
            'const __a = 3': (vars, path) => {
                return typeof putout;
            }
        });
    `);
    
    t.notOk(report());
    t.end();
});

test('putout-editor: client: parsers: putout: initPlugin: putout', (t) => {
    const {replace} = initPlugin(`
        export const replace = () => ({
            'const __a = 3': (vars, path) => {
                return typeof putout;
            }
        });
    `) as Replacer;
    
    const getReplacement = replace as () => {
        'const __a = 3': () => string;
    };
    
    const result = getReplacement()['const __a = 3']();
    
    t.equal(result, 'function');
    t.end();
});

test('putout-editor: client: parsers: putout: initPlugin: node:path', (t) => {
    const {report} = initPlugin(`
        import path from 'node:path';
        
        export const replace = () => ({
            'const __a = 3': (vars, path) => {
                return typeof putout;
            }
        });
    `);
    
    t.deepEqual(report, noop);
    t.end();
});

test('putout-editor: client: parsers: putout: initPlugin: path', (t) => {
    const {report} = initPlugin(`
        import path from 'path';
        
        export const replace = () => ({
            'const __a = 3': (vars, path) => {
                return typeof putout;
            }
        });
    `);
    
    t.deepEqual(report, noop);
    t.end();
});

test('putout-editor: client: parsers: putout: initPlugin: report', (t) => {
    const {report} = initPlugin(`
        export const report = () => 'hello';
        export const replace = () => ({
            'const __a = 3': (vars, path) => {
                return typeof putout;
            }
        });
    `);
    
    const result = report();
    const expected = 'hello';
    
    t.equal(result, expected);
    t.end();
});
