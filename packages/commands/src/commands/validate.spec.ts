import {test} from 'supertape';
import {runValidate} from './validate.ts';

const plugin = 'export const report = () => "use const";\nexport const replace = () => ({ "var __x = __y": "const __x = __y" });';

test('validate: a valid plugin is ok', (t) => {
    const result = runValidate(plugin);
    const expected = {
        type: 'text',
        data: 'ok',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('validate: no plugin is an error', (t) => {
    const result = runValidate('');
    const expected = {
        type: 'error',
        message: 'No plugin. Put the plugin on the next line.',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('validate: a broken plugin is an error', (t) => {
    const result = runValidate('export const = broken');
    const expected = 'error';
    
    t.equal(result.type, expected);
    t.end();
});
