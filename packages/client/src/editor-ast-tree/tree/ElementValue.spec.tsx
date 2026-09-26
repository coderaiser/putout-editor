import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import ElementValue from './ElementValue.tsx';
import type {TreeAdapterChild} from './types.ts';

const noop = () => {};

const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';

const renderSubElement = (key: string, value: unknown, name: string | null | undefined) => (
    <span key={key} data-el-key={key} data-el-name={name}>{String(value)}</span>
);

type ElementOptions = {
    open?: boolean;
    error?: Error | null;
    nodeName?: string | null;
    showAsSelected?: boolean;
    children?: TreeAdapterChild[];
    onClick?: () => void;
    onExecFunction?: () => void;
    createSubElement?: typeof renderSubElement;
};

const makeElement = (value: unknown, options: ElementOptions = {}) => (
    <ElementValue
        value={value}
        open={options.open || false}
        error={options.error || null}
        nodeName={options.nodeName || null}
        showAsSelected={options.showAsSelected || false}
        children={isUndefined(options.children) ? [] : options.children}
        onClick={options.onClick}
        onExecFunction={options.onExecFunction || noop}
        createSubElement={options.createSubElement || renderSubElement}
    />
);

test('ElementValue: renders primitive string in s span', (t) => {
    render(makeElement('hello'));
    
    const result = document.querySelector('.s')!;
    
    cleanup();
    
    t.equal(result.textContent, '"hello"');
    t.end();
});

test('ElementValue: renders null as stringified null', (t) => {
    render(makeElement(null));
    
    const result = document.querySelector('.s')!;
    
    cleanup();
    
    t.equal(result.textContent, 'null');
    t.end();
});

test('ElementValue: renders function with invokeable class', (t) => {
    render(makeElement(noop));
    
    const result = document.querySelector('.invokeable')!;
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ElementValue: renders error triangle when error present', (t) => {
    render(makeElement({}, {
        error: Error('boom'),
    }));
    
    const result = document.querySelector('svg title')!;
    
    cleanup();
    
    t.equal(result.textContent, 'boom');
    t.end();
});

test('ElementValue: renders no error triangle when error absent', (t) => {
    render(makeElement({}));
    
    const result = document.querySelector('svg')!;
    
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
    
    const prefix = document.querySelector('.prefix')!;
    
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
    
    const suffix = document.querySelector('.suffix')!;
    
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
    
    const body = document.querySelector('.value-body')!;
    
    cleanup();
    
    t.equal(body.children.length, 2);
    t.end();
});

test('ElementValue: renders compact array view when closed', (t) => {
    render(makeElement(['a', 'b'], {
        children: [],
    }));
    
    const result = document.querySelector('.compact')!;
    
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
    
    const prefix = document.querySelector('.prefix')!;
    
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
    
    const suffix = document.querySelector('.suffix')!;
    
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
    
    const body = document.querySelector('.value-body')!;
    
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
    
    const result = document.querySelector('.compact')!;
    
    cleanup();
    
    t.equal(result.textContent, 'x');
    t.end();
});

test('ElementValue: renders nodeName token when provided', (t) => {
    render(makeElement({}, {
        nodeName: 'Identifier',
    }));
    
    const result = document.querySelector('.tokenName')!;
    
    cleanup();
    
    t.match(result.textContent, 'Identifier');
    t.end();
});

test('ElementValue: renders node marker when showAsSelected', (t) => {
    render(makeElement({}, {
        nodeName: 'Identifier',
        showAsSelected: true,
    }));
    
    const token = document.querySelector('.tokenName')!;
    const marker = token.querySelector('.ge')!;
    
    cleanup();
    const result = marker.textContent!.includes('$node');
    
    t.ok(result);
    t.end();
});

// An array value renders its children only when it is open, and the children

// come from the `children` prop - not from the array value - so a test that

// passes an array and no children proves nothing.
const makeChildren = (): TreeAdapterChild[] => [{
    key: '0',
    value: 1,
    computed: false,
}, {
    key: '1',
    value: 2,
    computed: false,
}, {
    key: '2',
    value: 3,
    computed: false,
}, // `length` is the array's own, and must not become a child
{
    key: 'length',
    value: 3,
    computed: false,
}];

// A numeric key is an array index, so the sub-element is unnamed; any other
// key is a property name and must survive into the rendered name.
test('ElementValue: keeps a non-index child key as its name', (t) => {
    const {container} = render(makeElement([1], {
        open: true,
        children: [{
            key: 'name',
            value: 'identifier',
            computed: false,
        }],
    }));
    
    const result = container.querySelector('[data-el-name]')?.getAttribute('data-el-name');
    const expected = 'name';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ElementValue: a collapsed array does not render its children', (t) => {
    const {container} = render(makeElement([1, 2, 3], {
        open: false,
        children: makeChildren(),
    }));
    
    const result = container.querySelectorAll('[data-el-key]').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ElementValue: an open array renders its children, without length', (t) => {
    const {container} = render(makeElement([1, 2, 3], {
        open: true,
        children: makeChildren(),
    }));
    
    const result = container.querySelectorAll('[data-el-key]').length;
    const expected = 3;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
