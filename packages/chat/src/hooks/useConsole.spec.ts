import {test} from 'supertape';
import type {Message} from '#store';
import {latestAst} from './useConsole.ts';

const ast = (id: number): Message => ({
    id,
    text: '/ast',
    result: {
        type: 'ast',
        nodes: [],
        source: 'const a = 1;',
    },
});

const text = (id: number): Message => ({
    id,
    text: '/help',
    result: {
        type: 'text',
        data: 'ok',
    },
});

test('useConsole: an empty thread has no ast', (t) => {
    const result = latestAst([]);
    
    t.notOk(result);
    t.end();
});

test('useConsole: a thread with no ast result has none', (t) => {
    const result = latestAst([
        text(1),
        text(2),
    ]);
    
    t.notOk(result);
    t.end();
});

test('useConsole: the single ast result is found', (t) => {
    const message = latestAst([
        text(1),
        ast(2),
    ]);
    
    const result = message && message.id;
    const expected = 2;
    
    t.equal(result, expected);
    t.end();
});

test('useConsole: the newest of several ast results wins', (t) => {
    const message = latestAst([
        ast(1),
        text(2),
        ast(3),
    ]);
    
    const result = message && message.id;
    const expected = 3;
    
    t.equal(result, expected);
    t.end();
});

test('useConsole: an ast result with no result yet is skipped', (t) => {
    const pending: Message = {
        id: 1,
        text: '/ast',
        result: null,
    };
    
    const result = latestAst([pending]);
    
    t.notOk(result);
    t.end();
});
