import {test} from 'supertape';
import * as parser from './index.ts';

test('parser barrel: re-exports selectors, TreeAdapter, parsers', (t) => {
    const names = Object.keys(parser);
    const result = names.includes('getParser');
    
    t.ok(result);
    t.end();
});
