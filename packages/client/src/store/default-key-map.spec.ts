import {test} from 'supertape';
import {tryCatch} from 'try-catch';
import {getDefaultKeyMap} from './default-key-map.ts';

const withGlobals = (globals: {
    innerWidth: number;
    maxTouchPoints: number;
}, fn: () => void) => {
    const {innerWidth} = globalThis;
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')!;
    
    globalThis.innerWidth = globals.innerWidth;
    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
            maxTouchPoints: globals.maxTouchPoints,
        },
    });
    
    tryCatch(fn);
    
    globalThis.innerWidth = innerWidth;
    Object.defineProperty(globalThis, 'navigator', descriptor);
};

test('default-key-map: vim on a wide screen without touch', (t) => {
    let result = '';
    
    withGlobals({innerWidth: 1280, maxTouchPoints: 0}, () => {
        result = getDefaultKeyMap();
    });
    
    t.equal(result, 'vim');
    t.end();
});

test('default-key-map: default on a narrow screen', (t) => {
    let result = '';
    
    withGlobals({innerWidth: 375, maxTouchPoints: 0}, () => {
        result = getDefaultKeyMap();
    });
    
    t.equal(result, 'default');
    t.end();
});

test('default-key-map: default on a touch device', (t) => {
    let result = '';
    
    withGlobals({innerWidth: 1280, maxTouchPoints: 5}, () => {
        result = getDefaultKeyMap();
    });
    
    t.equal(result, 'default');
    t.end();
});
