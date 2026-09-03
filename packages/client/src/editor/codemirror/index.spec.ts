import {test} from 'supertape';
import * as api from './index.ts';

test('editor/codemirror index: re-exports all public members', (t) => {
    const names = Object.keys(api);
    
    t.ok(names.length > 20);
    t.end();
});
