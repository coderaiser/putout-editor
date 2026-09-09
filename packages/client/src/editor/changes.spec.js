import {test} from 'supertape';
import {getDocChanges} from './changes.ts';

test('changes: equal strings', (t) => {
    const result = getDocChanges('const x = 1;', 'const x = 1;');
    
    t.equal(result, null);
    t.end();
});

test('changes: insert at end', (t) => {
    const result = getDocChanges('abc', 'abcdef');
    const expected = {
        from: 3,
        to: 3,
        insert: 'def',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: insert at start', (t) => {
    const result = getDocChanges('abc', 'xyzabc');
    const expected = {
        from: 0,
        to: 0,
        insert: 'xyz',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: insert in middle', (t) => {
    const result = getDocChanges('hello world', 'hello  world');
    const expected = {
        from: 6,
        to: 6,
        insert: ' ',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: delete at end', (t) => {
    const result = getDocChanges('abcdef', 'abc');
    const expected = {
        from: 3,
        to: 6,
        insert: '',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: delete at start', (t) => {
    const result = getDocChanges('ab', 'b');
    const expected = {
        from: 0,
        to: 1,
        insert: '',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: delete repeated character', (t) => {
    const result = getDocChanges('aaa', 'aa');
    const expected = {
        from: 2,
        to: 3,
        insert: '',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: replace', (t) => {
    const result = getDocChanges('const x=1', 'const x = 1;');
    const expected = {
        from: 7,
        to: 9,
        insert: ' = 1;',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: replace between prefix and suffix', (t) => {
    const result = getDocChanges('axa', 'aya');
    const expected = {
        from: 1,
        to: 2,
        insert: 'y',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: from empty to value', (t) => {
    const result = getDocChanges('', 'a');
    const expected = {
        from: 0,
        to: 0,
        insert: 'a',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: from value to empty', (t) => {
    const result = getDocChanges('a', '');
    const expected = {
        from: 0,
        to: 1,
        insert: '',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('changes: multiline format keeps unrelated lines', (t) => {
    const oldDoc = 'const x=1;\nconst y=2;';
    const newDoc = 'const x = 1;\nconst y=2;';
    const result = getDocChanges(oldDoc, newDoc);
    
    t.ok(result.from < 12 && result.to < 12, 'change is limited to the first line');
    t.end();
});
