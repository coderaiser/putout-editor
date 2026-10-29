import {test} from 'supertape';
import {isTypeScript, resolveTS} from './language.ts';

test('language: JavaScript is not TypeScript', (t) => {
    const result = isTypeScript('const a = 1;');
    
    t.notOk(result);
    t.end();
});

test('language: JSX is not TypeScript', (t) => {
    const result = isTypeScript('const a = <div/>;');
    
    t.notOk(result);
    t.end();
});

test('language: an as cast is TypeScript', (t) => {
    const result = isTypeScript('const b = v as boolean;');
    
    t.ok(result);
    t.end();
});

test('language: a type annotation is TypeScript', (t) => {
    const result = isTypeScript('const a: number = 1;');
    
    t.ok(result);
    t.end();
});

test('language: source that parses as neither is not TypeScript', (t) => {
    const result = isTypeScript('const = ;');
    
    t.notOk(result);
    t.end();
});

test('language: resolveTS keeps an explicit false', (t) => {
    const result = resolveTS('const b = v as boolean;', false);
    
    t.notOk(result);
    t.end();
});

test('language: resolveTS keeps an explicit true', (t) => {
    const result = resolveTS('const a = 1;', true);
    
    t.ok(result);
    t.end();
});

test('language: resolveTS finds TypeScript when isTS is not given', (t) => {
    const result = resolveTS('const b = v as boolean;');
    
    t.ok(result);
    t.end();
});
