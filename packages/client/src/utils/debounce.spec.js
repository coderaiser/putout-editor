import {test} from 'supertape';
import debounce from './debounce.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('debounce: uses default timeout', async (t) => {
    let called = false;
    const fn = debounce(() => {
        called = true;
    });
    
    fn();
    
    await wait(150);
    
    t.ok(called);
    t.end();
});

test('debounce: calls once after rapid calls', async (t) => {
    let count = 0;
    const fn = debounce(() => {
        count++;
    }, 10);
    
    fn();
    fn();
    fn();
    
    await wait(30);
    
    t.equal(count, 1);
    t.end();
});

test('debounce: passes last call args', async (t) => {
    let received;
    const fn = debounce((value) => {
        received = value;
    }, 10);
    
    fn('first');
    fn('second');
    
    await wait(30);
    
    t.equal(received, 'second');
    t.end();
});

test('debounce: fires again after timeout elapses', async (t) => {
    let count = 0;
    const fn = debounce(() => {
        count++;
    }, 10);
    
    fn();
    await wait(30);
    fn();
    await wait(30);
    
    t.equal(count, 2);
    t.end();
});
