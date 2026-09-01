import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import TransformButton from './TransformButton.js';

const mockTransformer = {
    id: 'putout',
    displayName: 'putout',
};

const mockCategory = {
    transformers: [mockTransformer],
};

const emptyCategory = {
    transformers: [],
};

const noop = () => {};

test('TransformButton: renders Transform label', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const btn = document.querySelector('.menuButton > button');
    
    cleanup();
    const result = btn.textContent.includes('Transform');
    
    t.ok(result);
    t.end();
});

test('TransformButton: renders transformer items when category has transformers', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const items = document.querySelectorAll('li');
    
    cleanup();
    
    t.equal(items.length, 1);
    t.end();
});

test('TransformButton: renders no ul when category has no transformers', (t) => {
    render(
        <TransformButton
            category={emptyCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const ul = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(ul);
    t.end();
});

test('TransformButton: trigger button disabled when no transformers', (t) => {
    render(
        <TransformButton
            category={emptyCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const btn = document.querySelector('.menuButton > button');
    
    cleanup();
    
    t.ok(btn.disabled);
    t.end();
});

test('TransformButton: has disabled class when no transformers', (t) => {
    render(
        <TransformButton
            category={emptyCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const div = document.querySelector('.menuButton');
    
    cleanup();
    const result = div.className.includes('disabled');
    
    t.ok(result);
    t.end();
});

test('TransformButton: clicking trigger calls onTransformChange(null) when transformer active', (t) => {
    let called = false;
    
    const onTransformChange = (v) => {
        called = v === null;
    };
    
    render(
        <TransformButton
            category={mockCategory}
            transformer={mockTransformer}
            showTransformer={true}
            onTransformChange={onTransformChange}
        />,
    );
    
    fireEvent.click(document.querySelector('.menuButton > button'));
    
    cleanup();
    
    t.ok(called);
    t.end();
});

test('TransformButton: clicking trigger does not call onTransformChange when no transformer', (t) => {
    let callCount = 0;
    
    const onTransformChange = () => {
        callCount++;
    };
    
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={onTransformChange}
        />,
    );
    
    fireEvent.click(document.querySelector('.menuButton > button'));
    
    cleanup();
    
    t.equal(callCount, 0);
    t.end();
});

test('TransformButton: clicking trigger sets is-closed class', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const div = document.querySelector('.menuButton');
    
    fireEvent.click(document.querySelector('.menuButton > button'));
    
    const result = div.className.includes('is-closed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('TransformButton: clicking item via li node calls onTransformChange', (t) => {
    let changed;
    
    const onTransformChange = (v) => {
        changed = v;
    };
    
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={onTransformChange}
        />,
    );
    
    fireEvent.click(document.querySelector('li'));
    
    cleanup();
    
    t.equal(changed.id, 'putout');
    t.end();
});

test('TransformButton: clicking item via button node calls onTransformChange', (t) => {
    let changed;
    
    const onTransformChange = (v) => {
        changed = v;
    };
    
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={onTransformChange}
        />,
    );
    
    fireEvent.click(document.querySelector('li button'));
    
    cleanup();
    
    t.equal(changed.id, 'putout');
    t.end();
});

test('TransformButton: clicking item sets is-closed class', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const div = document.querySelector('.menuButton');
    
    fireEvent.click(document.querySelector('li'));
    
    const result = div.className.includes('is-closed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('TransformButton: mouseleave clears is-closed class', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const div = document.querySelector('.menuButton');
    
    fireEvent.click(document.querySelector('.menuButton > button'));
    fireEvent.mouseLeave(div);
    
    const result = div.className.includes('is-closed');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('TransformButton: selected class applied to active transformer item', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={mockTransformer}
            showTransformer={true}
            onTransformChange={noop}
        />,
    );
    
    const li = document.querySelector('li');
    
    cleanup();
    const result = li.className.includes('selected');
    
    t.ok(result);
    t.end();
});

test('TransformButton: renders toggle button svg icon', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={mockTransformer}
            showTransformer={true}
            onTransformChange={noop}
        />,
    );
    
    const svg = document.querySelector('.menuButton > button svg');
    
    cleanup();
    
    t.ok(svg, 'toggle icon svg rendered');
    t.end();
});

test('TransformButton: renders toggle icon with showTransformer true', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={mockTransformer}
            showTransformer={true}
            onTransformChange={noop}
        />,
    );
    
    const svg = document.querySelector('.menuButton > button svg');
    
    cleanup();
    
    t.ok(svg, 'toggle-on icon svg rendered');
    t.end();
});

test('TransformButton: renders toggle icon when showTransformer false', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const svg = document.querySelector('.menuButton > button svg');
    
    cleanup();
    
    t.ok(svg, 'toggle-off icon svg rendered');
    t.end();
});
