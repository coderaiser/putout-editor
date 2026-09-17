import {test} from 'supertape';
import isFocused from './isFocused.ts';

const node = {
    type: 'Identifier',
};

const path = [node];

test('isFocused: returns falsy when level is 0', (t) => {
    t.notOk(isFocused(0, path, node, false));
    t.end();
});

test('isFocused: returns false when value not in path', (t) => {
    const result = isFocused(1, path, {type: 'Other'}, false);
    
    t.notOk(result);
    t.end();
});

test('isFocused: returns true when in path and closed', (t) => {
    const result = isFocused(1, path, node, false);
    
    t.ok(result);
    t.end();
});

test('isFocused: returns false when in path, open, and not leaf', (t) => {
    const parent = {
        type: 'Program',
    };
    
    const result = isFocused(1, [parent, node], parent, true);
    
    t.notOk(result);
    t.end();
});

test('isFocused: returns true when in path, open, and is leaf', (t) => {
    const result = isFocused(1, path, node, true);
    
    t.ok(result);
    t.end();
});
