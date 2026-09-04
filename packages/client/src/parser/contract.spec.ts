import {test} from 'supertape';
import {
    isCharOffset,
    parseCharOffset,
    parseSourceRange,
    parseSourcePosition,
} from './contract.ts';

test('parser: contract: parseSourceRange returns [0, 5] for valid pair', (t) => {
    const result = parseSourceRange([0, 5]);
    const expected = [0, 5];
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: contract: parseSourceRange returns null for object start/end (babel loc)', (t) => {
    const loc = {
        start: {
            line: 1,
            column: 0,
            index: 0,
        },
        end: {
            line: 1,
            column: 12,
            index: 12,
        },
    };
    
    const result = parseSourceRange([
        loc.start,
        loc.end,
    ]);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for NaN', (t) => {
    const result = parseSourceRange([NaN, 5]);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for Infinity', (t) => {
    const result = parseSourceRange([Infinity, 5]);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for negative offset', (t) => {
    const result = parseSourceRange([-1, 5]);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for string entries', (t) => {
    const result = parseSourceRange(['0', '5']);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for null', (t) => {
    const result = parseSourceRange(null);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for undefined', (t) => {
    const result = parseSourceRange(undefined);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for short array', (t) => {
    const result = parseSourceRange([0]);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for long array', (t) => {
    const result = parseSourceRange([0, 1, 2]);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourceRange returns null for plain object', (t) => {
    const result = parseSourceRange({});
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseCharOffset returns 0 for zero', (t) => {
    const result = parseCharOffset(0);
    
    t.equal(result, 0);
    t.end();
});

test('parser: contract: parseCharOffset returns 7 for seven', (t) => {
    const result = parseCharOffset(7);
    
    t.equal(result, 7);
    t.end();
});

test('parser: contract: parseCharOffset returns null for NaN', (t) => {
    const result = parseCharOffset(NaN);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseCharOffset returns null for Infinity', (t) => {
    const result = parseCharOffset(Infinity);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseCharOffset returns null for negative', (t) => {
    const result = parseCharOffset(-1);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseCharOffset returns null for string', (t) => {
    const result = parseCharOffset('5');
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseCharOffset returns null for null', (t) => {
    const result = parseCharOffset(null);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseCharOffset returns null for undefined', (t) => {
    const result = parseCharOffset(undefined);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseCharOffset returns null for object', (t) => {
    const result = parseCharOffset({});
    
    t.notOk(result);
    t.end();
});

test('parser: contract: isCharOffset returns true for number', (t) => {
    const result = isCharOffset(5);
    
    t.ok(result);
    t.end();
});

test('parser: contract: isCharOffset returns false for NaN', (t) => {
    const result = isCharOffset(NaN);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: isCharOffset returns false for object', (t) => {
    const result = isCharOffset({});
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourcePosition returns {line, ch} for valid object', (t) => {
    const result = parseSourcePosition({
        line: 1,
        ch: 4,
    });
    
    const expected = {
        line: 1,
        ch: 4,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('parser: contract: parseSourcePosition returns null for babel loc position', (t) => {
    const result = parseSourcePosition({
        line: 1,
        column: 0,
        index: 0,
    });
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourcePosition returns null for null', (t) => {
    const result = parseSourcePosition(null);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourcePosition returns null for undefined', (t) => {
    const result = parseSourcePosition(undefined);
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourcePosition returns null for string', (t) => {
    const result = parseSourcePosition('x');
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourcePosition returns null when ch missing', (t) => {
    const result = parseSourcePosition({
        line: 1,
    });
    
    t.notOk(result);
    t.end();
});

test('parser: contract: parseSourcePosition returns null when line null', (t) => {
    const result = parseSourcePosition({
        line: null,
        ch: 0,
    });
    
    t.notOk(result);
    t.end();
});
