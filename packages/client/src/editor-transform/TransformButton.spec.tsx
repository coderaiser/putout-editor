import {test} from 'supertape';
import {
    render as testingRender,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import type {ReactElement} from 'react';
import {
    type ParserCategory,
    type TransformerInfo,
} from '#parser';
import TransformButton from './TransformButton.tsx';
import {ToolbarMenuProvider} from '../store/ToolbarMenuContext.tsx';

const render = (ui: ReactElement) => testingRender(
    <ToolbarMenuProvider>
        {ui}
    </ToolbarMenuProvider>,
);

const openTransform = () => fireEvent.click(document.querySelector('.menuButton > button')!);

const mockTransformer: TransformerInfo = {
    id: 'putout',
    displayName: 'putout',
    loadTransformer: (callback: (value: unknown) => void) => callback(null),
    transform: () => '',
};

const mockCategory: ParserCategory = {
    id: 'javascript',
    displayName: 'JavaScript',
    mimeTypes: [],
    fileExtension: 'js',
    codeExample: '',
    transformers: [mockTransformer],
    parsers: [],
};

const emptyCategory: ParserCategory = {
    id: 'javascript',
    displayName: 'JavaScript',
    mimeTypes: [],
    fileExtension: 'js',
    codeExample: '',
    parsers: [],
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
    
    const btn = document.querySelector('.menuButton > button')!;
    
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
    openTransform();
    
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
    
    const btn = document.querySelector('.menuButton > button') as HTMLButtonElement;
    
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
    
    const div = document.querySelector('.menuButton')!;
    
    cleanup();
    const result = div.className.includes('disabled');
    
    t.ok(result);
    t.end();
});

test('TransformButton: clicking trigger opens menu when transformer active', (t) => {
    const onTransformChange = () => {};
    
    render(
        <TransformButton
            category={mockCategory}
            transformer={mockTransformer}
            showTransformer={true}
            onTransformChange={onTransformChange}
        />,
    );
    openTransform();
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('TransformButton: clicking trigger does not call onTransformChange when no transformer', (t) => {
    let called = false;
    
    const onTransformChange = () => {
        called = true;
    };
    
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={onTransformChange}
        />,
    );
    
    fireEvent.click(document.querySelector('.menuButton > button')!);
    
    cleanup();
    
    t.notOk(called);
    t.end();
});

test('TransformButton: clicking item calls onTransformChange with transformer', (t) => {
    let changed: TransformerInfo | null = null;
    
    const onTransformChange = (v: TransformerInfo | null) => {
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
    openTransform();
    
    fireEvent.click(document.querySelector('li button')!);
    
    cleanup();
    
    t.equal(changed!.id, 'putout');
    t.end();
});

test('TransformButton: clicking item closes menu', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    openTransform();
    
    fireEvent.click(document.querySelector('li')!);
    
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('TransformButton: second trigger click closes menu', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    
    const trigger = document.querySelector('.menuButton > button')!;
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    const result = document.querySelector('ul');
    
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
    openTransform();
    
    const li = document.querySelector('li');
    
    cleanup();
    const result = li?.className.includes('selected') || false;
    
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

test('TransformButton: outside click closes menu', (t) => {
    render(
        <TransformButton
            category={mockCategory}
            transformer={null}
            showTransformer={false}
            onTransformChange={noop}
        />,
    );
    openTransform();
    fireEvent.mouseDown(document.body);
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

