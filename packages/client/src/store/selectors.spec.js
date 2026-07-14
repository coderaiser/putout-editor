import {test} from 'supertape';
import {canFork} from './selectors.js';

test('selectors: canFork: no revision: false', (t) => {
    const canForkValue = canFork({
        activeRevision: null,
    });
    
    t.notOk(canForkValue);
    t.end();
});

test('selectors: canFork: with revision: true', (t) => {
    const canForkValue = canFork({
        activeRevision: {
            id: '1',
        },
    });
    
    t.ok(canForkValue);
    t.end();
});
