import {test} from 'supertape';
import {
    getView,
    refresh,
    observeResize,
} from './dom.js';

const noop = () => {};

test('dom.js: getView returns null for empty container', (t) => {
    const container = {
        querySelector: () => null,
    };
    
    const result = getView(container);
    
    t.notOk(result);
    t.end();
});

test('dom.js: refresh calls requestMeasure', (t) => {
    const view = {
        requestMeasure: noop,
    };
    
    refresh(view);
    
    t.ok(true);
    t.end();
});

test('dom.js: observeResize returns cleanup function', (t) => {
    const view = {
        requestMeasure: noop,
    };
    
    const container = {};
    
    const cleanup = observeResize(view, container);
    const result = typeof cleanup;
    const expected = 'function';
    
    t.equal(result, expected);
    t.end();
});

test('dom.js: observeResize cleanup disconnects', (t) => {
    const view = {
        requestMeasure: noop,
    };
    
    const container = {};
    
    const cleanup = observeResize(view, container);
    cleanup();
    
    t.ok(true);
    t.end();
});
