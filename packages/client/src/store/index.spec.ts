import {test} from 'supertape';
import * as store from './index.ts';

test('store barrel: re-exports reducers, selectors, operations', (t) => {
    const names = Object.keys(store);
    const result = names.includes('parseCode');
    
    t.ok(result);
    t.end();
});
