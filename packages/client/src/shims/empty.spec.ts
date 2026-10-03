import {test} from 'supertape';
import empty from './empty.js';

test('empty: exports nothing a node-only package can call', (t) => {
    const result = Object.keys(empty);
    const expected: string[] = [];
    
    t.deepEqual(result, expected);
    t.end();
});

test('empty: a member read off it is undefined, not a throw', (t) => {
    const {notThere} = empty as Record<string, unknown>;
    const result = typeof notThere;
    const expected = 'undefined';
    
    t.equal(result, expected);
    t.end();
});
