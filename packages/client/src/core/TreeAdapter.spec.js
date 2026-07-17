import {test} from 'supertape';
import {
    ignoreKeysFilter,
    locationInformationFilter,
    functionFilter,
    emptyKeysFilter,
    typeKeysFilter,
} from './TreeAdapter.js';

const noop = () => {};

test('TreeAdapter: ignoreKeysFilter: filters key in set', (t) => {
    const filter = ignoreKeysFilter(new Set([
        'start',
        'end',
    ]));
    
    t.ok(filter.test(null, 'start'));
    t.end();
});

test('TreeAdapter: ignoreKeysFilter: passes key not in set', (t) => {
    const filter = ignoreKeysFilter(new Set(['start']));
    
    t.notOk(filter.test(null, 'type'));
    t.end();
});

test('TreeAdapter: ignoreKeysFilter: empty set passes everything', (t) => {
    const filter = ignoreKeysFilter();
    
    t.notOk(filter.test(null, 'anything'));
    t.end();
});

test('TreeAdapter: functionFilter: filters function values', (t) => {
    const filter = functionFilter();
    
    t.ok(filter.test(noop, 'fn'));
    t.end();
});

test('TreeAdapter: functionFilter: passes non-function values', (t) => {
    const filter = functionFilter();
    
    t.notOk(filter.test('string', 'key'));
    t.end();
});

test('TreeAdapter: functionFilter: key is hideFunctions', (t) => {
    t.equal(functionFilter().key, 'hideFunctions');
    t.end();
});

test('TreeAdapter: emptyKeysFilter: filters null', (t) => {
    t.ok(emptyKeysFilter().test(null, 'k'));
    t.end();
});

test('TreeAdapter: emptyKeysFilter: filters undefined', (t) => {
    t.ok(emptyKeysFilter().test(undefined, 'k'));
    t.end();
});

test('TreeAdapter: emptyKeysFilter: passes non-empty value', (t) => {
    t.notOk(emptyKeysFilter().test(0, 'k'));
    t.end();
});

test('TreeAdapter: locationInformationFilter: key is hideLocationData', (t) => {
    t.equal(locationInformationFilter(new Set()).key, 'hideLocationData');
    t.end();
});

test('TreeAdapter: typeKeysFilter: key is hideTypeKeys', (t) => {
    t.equal(typeKeysFilter(new Set()).key, 'hideTypeKeys');
    t.end();
});
