import {test} from 'supertape';
import {lint, fix} from './helpers.js';

const MESSAGE = 'Lowercase the key after a modifier: a browser reports Ctrl+V as "v"';

test('press-modifier-case: reports a modifier plus an uppercase key', (t) => {
    const {places} = lint(`page.keyboard.press('Control+V');`);
    const result = places.length;
    const expected = 1;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: message explains why', (t) => {
    const {places} = lint(`page.keyboard.press('Control+V');`);
    const result = places[0].message;
    const expected = MESSAGE;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: fixes the key', (t) => {
    const {code} = fix(`page.keyboard.press('Control+V');`);
    const result = code;
    const expected = `page.keyboard.press('Control+v');\n`;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: allows a lowercase key', (t) => {
    const {places} = lint(`page.keyboard.press('Control+v');`);
    const result = places.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: allows a key with no modifier', (t) => {
    const {places} = lint(`page.keyboard.press('V');`);
    const result = places.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: allows an uppercase key after a non modifier', (t) => {
    const {places} = lint(`page.keyboard.press('Page+V');`);
    const result = places.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: allows a multi word key', (t) => {
    const {places} = lint(`page.keyboard.press('Control+Shift+KEY');`);
    const result = places.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: ignores a call that is not press', (t) => {
    const {places} = lint(`page.keyboard.type('Control+V');`);
    const result = places.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: ignores a press with no arguments', (t) => {
    const {places} = lint(`page.keyboard.press();`);
    const result = places.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});

test('press-modifier-case: ignores a press with a non literal key', (t) => {
    const {places} = lint(`page.keyboard.press(key);`);
    const result = places.length;
    const expected = 0;
    
    t.equal(result, expected);
    t.end();
});
