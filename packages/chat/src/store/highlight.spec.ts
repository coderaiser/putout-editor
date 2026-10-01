import {test} from 'supertape';
import {
    setHighlight,
    setCursor,
    clearHighlight,
} from './highlight.ts';

test('highlight: the three no-op creators return nothing and throw nothing', (t) => {
    const calls = [
        () => setHighlight(),
        () => setCursor(),
        () => clearHighlight(),
    ];
    
    const result = [];
    
    for (const call of calls) {
        result.push(call());
    }
    
    const expected = [
        undefined,
        undefined,
        undefined,
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
