import {createTest} from '@putout/test';
import * as applyPressModifierCase from './index.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['apply-press-modifier-case', applyPressModifierCase],
    ],
});

test('putout-editor: apply-press-modifier-case: transform', (t) => {
    t.transform('apply-press-modifier-case');
    t.end();
});

test('putout-editor: apply-press-modifier-case: report', (t) => {
    t.reportCode(`page.keyboard.press('Control+V');`, `Lowercase the key after a modifier: a browser reports Ctrl+V as "v"`);
    t.end();
});
