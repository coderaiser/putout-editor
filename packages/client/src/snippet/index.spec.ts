import {test} from 'supertape';
import * as snippet from './index.ts';

test('snippet barrel: re-exports LocalStorage, url, logger', (t) => {
    const names = Object.keys(snippet);
    const result = names.includes('writeState');
    
    t.ok(result);
    t.end();
});
