import {test} from 'supertape';
import {tryCatch} from 'try-catch';
import {compilePlugin} from './plugin.ts';

const validPlugin = 'export const report = () => "use const";\nexport const replace = () => ({ "var __x = __y": "const __x = __y" });';

test('local plugin: compiles valid plugin', (t) => {
    const compiled = compilePlugin(validPlugin);
    const result = typeof compiled.report;
    const expected = 'function';
    
    t.equal(result, expected);
    t.end();
});

test('local plugin: throws plugin_syntax on bad code', (t) => {
    const [error] = tryCatch(compilePlugin, 'export const = broken');
    const result = (error as Error).message.startsWith('plugin_syntax:');
    
    t.ok(result);
    t.end();
});
