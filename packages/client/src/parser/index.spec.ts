import {test} from 'supertape';
import * as parser from '#parser';
import * as store from '#store';

// `getParser` and `getTransformer` select on RootState, so they are store
// selectors. Re-exporting them from the parser barrel was a value re-export
// that closed the store -> parser -> store cycle, and the cycle guard in
// src/no-runtime-import-cycles.spec.ts fails if it comes back.
test('parser barrel: does not re-export the store selectors', (t) => {
    const result = Object.keys(parser).includes('getParser');
    
    t.notOk(result);
    t.end();
});

test('parser barrel: still exports the parsers', (t) => {
    const result = Object.keys(parser).includes('getParserByID');
    
    t.ok(result);
    t.end();
});

test('store barrel: exports the parser selectors', (t) => {
    const result = Object.keys(store).includes('getParser');
    
    t.ok(result);
    t.end();
});
