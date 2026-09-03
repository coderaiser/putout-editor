import {test} from 'supertape';
import {
    keymapExtension,
    themeExtension,
    languageExtension,
} from './options.js';

test('options.js: keymapExtension vim returns extension object', (t) => {
    const result = keymapExtension('vim');
    
    t.ok(result);
    t.end();
});

test('options.js: keymapExtension emacs returns extension object', (t) => {
    const result = keymapExtension('emacs');
    
    t.ok(result);
    t.end();
});

test('options.js: keymapExtension default returns extension object', (t) => {
    const result = keymapExtension('default');
    
    t.ok(result);
    t.end();
});

test('options.js: themeExtension nord returns nord theme object', (t) => {
    const result = themeExtension('nord');
    
    t.ok(result);
    t.end();
});

test('options.js: themeExtension default returns empty array', (t) => {
    const result = themeExtension('default');
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('options.js: languageExtension javascript returns extension object', (t) => {
    const result = languageExtension('javascript');
    
    t.ok(result);
    t.end();
});

test('options.js: languageExtension object with javascript name returns extension', (t) => {
    const result = languageExtension({
        name: 'javascript',
        json: true,
    });
    
    t.ok(result);
    t.end();
});

test('options.js: languageExtension unknown string returns empty array', (t) => {
    const result = languageExtension('css');
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('options.js: languageExtension null returns empty array', (t) => {
    const result = languageExtension(null);
    const expected = [];
    
    t.deepEqual(result, expected);
    t.end();
});
