import {test, stub} from 'supertape';
import {readState, writeState} from './LocalStorage.js';

test('LocalStorage: writeState: default storage: writes to real localStorage', (t) => {
    localStorage.clear();
    writeState({
        a: 1,
    });
    
    const result = localStorage.getItem('explorerSettingsV1');
    const expected = '{"a":1}';
    
    t.equal(result, expected);
    t.end();
});

test('LocalStorage: readState: default storage: reads from real localStorage', (t) => {
    localStorage.clear();
    localStorage.setItem('explorerSettingsV1', '{"a":1}');
    
    const result = readState();
    const expected = {
        a: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('LocalStorage: writeState: writes serialized state', (t) => {
    const setItem = stub();
    
    writeState({a: 1}, {
        setItem,
    });
    
    t.calledWith(setItem, [
        'explorerSettingsV1',
        '{"a":1}',
    ]);
    t.end();
});

test('LocalStorage: writeState: no storage: returns undefined', (t) => {
    t.notOk(writeState({a: 1}, null));
    t.end();
});

test('LocalStorage: writeState: setItem throws: warns', (t) => {
    const warn = stub();
    const {warn: original} = console;
    
    const setItem = () => {
        throw Error('boom');
    };
    
    console.warn = warn;
    writeState({a: 1}, {
        setItem,
    });
    console.warn = original;
    
    t.calledWith(warn, ['Unable to write to local storage.']);
    t.end();
});

test('LocalStorage: readState: no storage: returns undefined', (t) => {
    const result = readState(null);
    
    t.notOk(result);
    t.end();
});

test('LocalStorage: readState: nothing stored: returns undefined', (t) => {
    const getItem = stub().returns(null);
    const result = readState({
        getItem,
    });
    
    t.notOk(result);
    t.end();
});

test('LocalStorage: readState: stored value: returns parsed state', (t) => {
    const getItem = stub().returns('{"a":1}');
    const result = readState({
        getItem,
    });
    
    const expected = {
        a: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('LocalStorage: readState: getItem throws: warns', (t) => {
    const warn = stub();
    const {warn: original} = console;
    
    const getItem = () => {
        throw Error('boom');
    };
    
    console.warn = warn;
    readState({
        getItem,
    });
    console.warn = original;
    
    t.calledWith(warn, ['Unable to read from local storage.']);
    t.end();
});
