import {test} from 'supertape';
import {getDataFromURI, updateURI} from './url.ts';

test('url: getDataFromURI: empty hash', (t) => {
    globalThis.location.hash = '';
    
    const result = getDataFromURI();
    const expected = {};
    
    t.deepEqual(result, expected);
    t.end();
});

test('url: getDataFromURI: id only', (t) => {
    globalThis.location.hash = '#/abc123';
    
    const result = getDataFromURI();
    const expected = {
        id: 'abc123',
        rev: 0,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('url: getDataFromURI: id and revision', (t) => {
    globalThis.location.hash = '#/abc123/5';
    
    const result = getDataFromURI();
    const expected = {
        id: 'abc123',
        rev: 5,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('url: getDataFromURI: with query params', (t) => {
    globalThis.location.hash = '#/abc123?parser=babel';
    
    const result = getDataFromURI();
    const expected = {
        id: 'abc123',
        rev: 0,
        parser: 'babel',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('url: updateURI: sets id and revision in hash', (t) => {
    globalThis.location.hash = '';
    
    updateURI({
        id: 'xyz',
        rev: 3,
    });
    
    t.equal(globalThis.location.hash, '#/xyz/3');
    t.end();
});

test('url: updateURI: omits revision when zero', (t) => {
    globalThis.location.hash = '';
    
    updateURI({
        id: 'xyz',
        rev: 0,
    });
    
    t.equal(globalThis.location.hash, '#/xyz');
    t.end();
});

test('url: updateURI: appends extra params as query string', (t) => {
    globalThis.location.hash = '';
    
    updateURI({
        id: 'xyz',
        parser: 'babel',
    });
    
    t.equal(globalThis.location.hash, '#/xyz?parser=babel');
    t.end();
});
