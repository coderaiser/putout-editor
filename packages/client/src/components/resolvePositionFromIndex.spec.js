import {test} from 'supertape';
import resolvePositionFromIndex from './resolvePositionFromIndex.js';

const makeSourceMap = (sourceContent, positionResult) => ({
    sourcesContent: [sourceContent],
    sources: ['a.js'],
    generatedPositionFor: () => positionResult,
});

test('resolvePositionFromIndex: returns undefined when sourceMap is null', (t) => {
    const result = resolvePositionFromIndex(null, 5);
    
    t.notOk(result);
    t.end();
});

test('resolvePositionFromIndex: returns origin for zero index', (t) => {
    const sourceMap = makeSourceMap('abc', {
        line: 0,
        column: 0,
    });
    
    const result = resolvePositionFromIndex(sourceMap, 0);
    
    const expected = {
        line: 0,
        ch: 0,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('resolvePositionFromIndex: maps index within a single line', (t) => {
    const sourceMap = makeSourceMap('const x = 1;', {
        line: 1,
        column: 5,
    });
    
    const result = resolvePositionFromIndex(sourceMap, 5);
    
    const expected = {
        line: 0,
        ch: 5,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('resolvePositionFromIndex: maps index across multiple lines', (t) => {
    const sourceMap = makeSourceMap('a\nb\nc', {
        line: 3,
        column: 1,
    });
    
    const result = resolvePositionFromIndex(sourceMap, 5);
    
    const expected = {
        line: 2,
        ch: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('resolvePositionFromIndex: accounts for content starting with newline', (t) => {
    const sourceMap = makeSourceMap('\nabc', {
        line: 2,
        column: 1,
    });
    
    const result = resolvePositionFromIndex(sourceMap, 2);
    
    const expected = {
        line: 1,
        ch: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('resolvePositionFromIndex: returns undefined when generated position is null', (t) => {
    const sourceMap = makeSourceMap('const x = 1;', {
        line: null,
        column: null,
    });
    
    const result = resolvePositionFromIndex(sourceMap, 5);
    
    t.notOk(result);
    t.end();
});
