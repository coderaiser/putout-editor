import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import ElementValue from './ElementValue.js';

const noop = () => {};

const isUndefined = (a) => typeof a === 'undefined';

const renderSubElement = (key, value, name) => (
    <span key={key} data-el-key={key} data-el-name={name}>{String(value)}</span>
);

const makeElement = (value, options = {}) => (
    <ElementValue
        value={value}
        open={options.open || false}
        error={options.error || null}
        nodeName={options.nodeName || null}
        showAsSelected={options.showAsSelected || false}
        children={isUndefined(options.children) ? [] : options.children}
        onClick={options.onClick || null}
        onExecFunction={options.onExecFunction || null}
        createSubElement={options.createSubElement || renderSubElement}
    />
);

test('ElementValue: renders primitive string in s span', (t) => {
    render(makeElement('hello'));
    
    const result = document.querySelector('.s');
    
    cleanup();
    
    t.equal(result.textContent, '"hello"');
    t.end();
});

test('ElementValue: renders null as stringified null', (t) => {
    render(makeElement(null));
    
    const result = document.querySelector('.s');
    
    cleanup();
    
    t.equal(result.textContent, 'null');
    t.end();
});

test('ElementValue: renders function with invokeable class', (t) => {
    render(makeElement(noop));
    
    const result = document.querySelector('.invokeable');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ElementValue: renders error triangle when error present', (t) => {
    render(makeElement({}, {
        error: Error('boom'),
    }));
    
    const result = document.querySelector('svg title');
    
    cleanup();
    
    t.equal(result.textContent, 'boom');
    t.end();
});

test('ElementValue: renders no error triangle when error absent', (t) => {
    render(makeElement({}));
    
    const result = document.querySelector('svg');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('ElementValue: expanded array renders prefix bracket', (t) => {
    render(makeElement(['a', 'b'], {
        open: true,
        children: [{
            key: '0',
            value: 'a',
            computed: false,
        }, {
            key: '1',
            value: 'b',
            computed: false,
        }],
    }));
    
    const prefix = document.querySelector('.prefix');
    
    cleanup();
    
    t.equal(prefix.textContent, '[');
    t.end();
});

test('ElementValue: expanded array renders suffix bracket', (t) => {
    render(makeElement(['a', 'b'], {
        open: true,
        children: [{
            key: '0',
            value: 'a',
            computed: false,
        }, {
            key: '1',
            value: 'b',
            computed: false,
        }],
    }));
    
    const suffix = document.querySelector('.suffix');
    
    cleanup();
    
    t.equal(suffix.textContent, ']');
    t.end();
});

test('ElementValue: expanded array renders sub elements', (t) => {
    render(makeElement(['a', 'b'], {
        open: true,
        children: [{
            key: '0',
            value: 'a',
            computed: false,
        }, {
            key: '1',
            value: 'b',
            computed: false,
        }],
    }));
    
    const body = document.querySelector('.value-body');
    
    cleanup();
    
    t.equal(body.children.length, 2);
    t.end();
});

test('ElementValue: renders compact array view when closed', (t) => {
    render(makeElement(['a', 'b'], {
        children: [],
    }));
    
    const result = document.querySelector('.compact');
    
    cleanup();
    
    t.equal(result.textContent, '2 elements');
    t.end();
});

test('ElementValue: expanded object renders prefix brace', (t) => {
    render(makeElement({x: 1}, {
        open: true,
        children: [{
            key: 'x',
            value: 1,
            computed: false,
        }],
    }));
    
    const prefix = document.querySelector('.prefix');
    
    cleanup();
    
    t.equal(prefix.textContent, '{');
    t.end();
});

test('ElementValue: expanded object renders suffix brace', (t) => {
    render(makeElement({x: 1}, {
        open: true,
        children: [{
            key: 'x',
            value: 1,
            computed: false,
        }],
    }));
    
    const suffix = document.querySelector('.suffix');
    
    cleanup();
    
    t.equal(suffix.textContent, '}');
    t.end();
});

test('ElementValue: expanded object renders sub elements', (t) => {
    render(makeElement({x: 1}, {
        open: true,
        children: [{
            key: 'x',
            value: 1,
            computed: false,
        }],
    }));
    
    const body = document.querySelector('.value-body');
    
    cleanup();
    
    t.equal(body.children.length, 1);
    t.end();
});

test('ElementValue: renders compact object view when closed', (t) => {
    render(makeElement({x: 1}, {
        children: [{
            key: 'x',
            value: 1,
            computed: false,
        }],
    }));
    
    const result = document.querySelector('.compact');
    
    cleanup();
    
    t.equal(result.textContent, 'x');
    t.end();
});

test('ElementValue: renders nodeName token when provided', (t) => {
    render(makeElement({}, {
        nodeName: 'Identifier',
    }));
    
    const result = document.querySelector('.tokenName');
    
    cleanup();
    
    t.match(result.textContent, 'Identifier');
    t.end();
});

test('ElementValue: renders node marker when showAsSelected', (t) => {
    render(makeElement({}, {
        nodeName: 'Identifier',
        showAsSelected: true,
    }));
    
    const token = document.querySelector('.tokenName');
    const marker = token?.querySelector('.ge');
    
    cleanup();
    const result = marker.textContent.includes('$node');
    
    t.ok(result);
    t.end();
});
