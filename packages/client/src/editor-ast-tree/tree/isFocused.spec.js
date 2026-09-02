import {test} from 'supertape';
import isFocused from './isFocused.js';

const node = {type: 'Identifier'};
const path = [node];

test('isFocused: returns falsy when level is 0', (t) => {
    t.notOk(isFocused(0, path, node, false));
    t.end();
});

test('isFocused: returns false when value not in path', (t) => {
    t.equal(isFocused(1, path, {type: 'Other'}, false), false);
    t.end();
});

test('isFocused: returns true when in path and closed', (t) => {
    t.equal(isFocused(1, path, node, false), true);
    t.end();
});

test('isFocused: returns false when in path, open, and not leaf', (t) => {
    const parent = {type: 'Program'};
    t.equal(isFocused(1, [parent, node], parent, true), false);
    t.end();
});

test('isFocused: returns true when in path, open, and is leaf', (t) => {
    t.equal(isFocused(1, path, node, true), true);
    t.end();
});