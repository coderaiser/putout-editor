import {test} from 'supertape';
import {
    composerKey,
    type ComposerContext,
} from './composerKeys.ts';

const contextOf = (overrides: Partial<ComposerContext> = {}): ComposerContext => ({
    text: '',
    open: false,
    exact: false,
    coarse: false,
    picked: 0,
    count: 0,
    cursor: -1,
    historyLength: 0,
    ...overrides,
});

const partial = (overrides: Partial<ComposerContext> = {}) => contextOf({
    text: '/tra',
    open: true,
    count: 3,
    ...overrides,
});

const key = (name: string, modifiers: object = {}) => ({
    key: name,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...modifiers,
});

const none = {
    action: null,
    prevent: false,
};

const complete = {
    action: {
        kind: 'complete',
    },
    prevent: true,
};

const send = {
    action: {
        kind: 'send',
    },
    prevent: true,
};

const pick = (index: number) => ({
    action: {
        kind: 'pick',
        index,
    },
    prevent: false,
});

const history = (index: number) => ({
    action: {
        kind: 'history',
        index,
    },
    prevent: false,
});

test('composerKeys: Enter completes a partial name while the list is open', (t) => {
    const result = composerKey(key('Enter'), partial());
    const expected = complete;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Enter sends a name that is exact', (t) => {
    const result = composerKey(key('Enter'), partial({
        exact: true,
    }));
    
    const expected = send;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Enter sends on a keyboard when the list is closed', (t) => {
    const result = composerKey(key('Enter'), contextOf());
    const expected = send;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Enter is a newline on a coarse pointer', (t) => {
    const result = composerKey(key('Enter'), contextOf({
        coarse: true,
    }));
    
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Enter completes a partial name on a coarse pointer too', (t) => {
    const result = composerKey(key('Enter'), partial({
        coarse: true,
    }));
    
    const expected = complete;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Shift+Enter is a newline', (t) => {
    const result = composerKey(key('Enter', {
        shiftKey: true,
    }), contextOf());
    
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Shift+Enter is a newline when the list is open', (t) => {
    const result = composerKey(key('Enter', {
        shiftKey: true,
    }), partial());
    
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Ctrl+Enter sends on a coarse pointer', (t) => {
    const result = composerKey(key('Enter', {
        ctrlKey: true,
    }), contextOf({
        coarse: true,
    }));
    
    const expected = send;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Cmd+Enter sends on a coarse pointer', (t) => {
    const result = composerKey(key('Enter', {
        metaKey: true,
    }), contextOf({
        coarse: true,
    }));
    
    const expected = send;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Ctrl+Enter sends a partial name and does not complete it', (t) => {
    const result = composerKey(key('Enter', {
        ctrlKey: true,
    }), partial());
    
    const expected = send;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Cmd+Enter sends a partial name and does not complete it', (t) => {
    const result = composerKey(key('Enter', {
        metaKey: true,
    }), partial());
    
    const expected = send;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Tab completes while the list is open', (t) => {
    const result = composerKey(key('Tab'), partial());
    const expected = complete;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Tab does nothing while the list is closed', (t) => {
    const result = composerKey(key('Tab'), contextOf());
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: Escape clears the box', (t) => {
    const result = composerKey(key('Escape'), partial());
    
    const expected = {
        action: {
            kind: 'clear',
        },
        prevent: false,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowDown picks the next option', (t) => {
    const result = composerKey(key('ArrowDown'), partial({
        picked: 0,
    }));
    
    const expected = pick(1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowDown wraps from the last option to the first', (t) => {
    const result = composerKey(key('ArrowDown'), partial({
        picked: 2,
    }));
    
    const expected = pick(0);
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowUp picks the previous option', (t) => {
    const result = composerKey(key('ArrowUp'), partial({
        picked: 2,
    }));
    
    const expected = pick(1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowUp wraps from the first option to the last', (t) => {
    const result = composerKey(key('ArrowUp'), partial({
        picked: 0,
    }));
    
    const expected = pick(2);
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowUp in an empty box recalls the newest line', (t) => {
    const result = composerKey(key('ArrowUp'), contextOf({
        historyLength: 3,
    }));
    
    const expected = history(0);
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowUp stops at the oldest line', (t) => {
    const result = composerKey(key('ArrowUp'), contextOf({
        cursor: 3,
        historyLength: 3,
    }));
    
    const expected = history(3);
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowDown walks back toward the box', (t) => {
    const result = composerKey(key('ArrowDown'), contextOf({
        cursor: 2,
        historyLength: 3,
    }));
    
    const expected = history(1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowDown stops at the box', (t) => {
    const result = composerKey(key('ArrowDown'), contextOf({
        cursor: -1,
        historyLength: 3,
    }));
    
    const expected = history(-1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowUp keeps the history out of a box with text', (t) => {
    const result = composerKey(key('ArrowUp'), contextOf({
        text: 'hello',
        historyLength: 3,
    }));
    
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: ArrowDown keeps the history out of a box with text', (t) => {
    const result = composerKey(key('ArrowDown'), contextOf({
        text: 'hello',
        cursor: 2,
        historyLength: 3,
    }));
    
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('composerKeys: another key does nothing', (t) => {
    const result = composerKey(key('a'), partial());
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});
