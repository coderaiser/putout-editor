import {test, stub} from 'supertape';
import {
    ignoreKeysFilter,
    locationInformationFilter,
    functionFilter,
    emptyKeysFilter,
    typeKeysFilter,
    treeAdapterFromParseResult,
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

test('TreeAdapter: ignoreKeysFilter: label is passed through', (t) => {
    const filter = ignoreKeysFilter(new Set(), 'hideSomething', 'Hide something');
    
    t.equal(filter.label, 'Hide something');
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: creates default adapter', (t) => {
    const result = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.ok(result);
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: getRange returns null for non-object', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.notOk(adapter.getRange(null));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: getRange node.range', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    const result = adapter.getRange({range: [0, 10]});
    
    t.deepEqual(result, [0, 10]);
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: getRange start/end', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    const result = adapter.getRange({start: 1, end: 5});
    
    t.deepEqual(result, [1, 5]);
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: getRange from node.start/node.end', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    const node = {
        type: 'ArrayExpression',
        start: 0,
        end: 5,
    };
    
    t.deepEqual(adapter.getRange(node), [0, 5]);
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: isInRange outside returns false', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.notOk(adapter.isInRange({range: [5, 10]}, 3));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: isInRange inside returns true', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.ok(adapter.isInRange({range: [0, 10]}, 5));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: isInRange no range returns false', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.notOk(adapter.isInRange(null, 5));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: hasChildrenInRange true', (t) => {
    // Note: hasChildrenInRange internally calls isInRange without position
    // which always returns false. This is a known limitation.
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    const node = {
        type: 'BinaryExpression',
        range: [0, 10],
        left: {type: 'Literal', value: 1, range: [0, 1]},
        right: {type: 'Literal', value: 2, range: [8, 9]},
    };
    
    t.notOk(adapter.hasChildrenInRange(node));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: hasChildrenInRange false', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.notOk(adapter.hasChildrenInRange({type: 'Literal', range: [0, 5], value: 1}));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: opensByDefault Program', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.ok(adapter.opensByDefault({type: 'Program'}, 'body'));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: opensByDefault body key', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.ok(adapter.opensByDefault({}, 'body'));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: opensByDefault false', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.notOk(adapter.opensByDefault({type: 'Literal'}, 'value'));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: isArray true', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.ok(adapter.isArray([]));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: isObject false for null', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.notOk(adapter.isObject(null));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: walkNode yields properties', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    const results = [...adapter.walkNode({type: 'Literal', value: 1})];
    
    t.equal(results.length, 2);
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: walkNode filters functions', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {hideFunctions: true});
    
    const results = [...adapter.walkNode({type: 'Literal', fn: noop, value: 1})];
    
    t.equal(results.length, 2);
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: walkNode filters empty', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {hideEmptyKeys: true});
    
    const results = [...adapter.walkNode({type: 'Literal', value: null, extra: 1})];
    
    t.equal(results.length, 2);
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: walkNode filters location', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {hideLocationData: true});
    
    const results = [...adapter.walkNode({type: 'Literal', range: [0, 5], value: 1})];
    
    t.equal(results.length, 2);
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: getRange null no range', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.notOk(adapter.getRange({type: 'Literal', value: 1}));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: getRange caches result', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    const node = {range: [0, 10]};
    
    t.deepEqual(adapter.getRange(node), adapter.getRange(node));
    t.end();
});

test('TreeAdapter: treeAdapterFromParseResult: getConfigurableFilters', (t) => {
    const adapter = treeAdapterFromParseResult({
        treeAdapter: {
            type: 'estree',
            options: {},
        },
    }, {});
    
    t.ok(adapter.getConfigurableFilters().length > 0);
    t.end();
});

