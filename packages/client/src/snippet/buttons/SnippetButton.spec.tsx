import {test} from 'supertape';
import {
    render as testingRender,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import type {ReactElement} from 'react';
import SnippetButton from './SnippetButton.tsx';
import type {Revision} from '../../store/reducers.ts';
import {ToolbarMenuProvider} from '../../store/ToolbarMenuContext.tsx';

const render = (ui: ReactElement) => testingRender(
    <ToolbarMenuProvider>
        {ui}
    </ToolbarMenuProvider>,
);

const noop = () => {};

const defaultProps = {
    canSave: true,
    canFork: false,
    saving: false,
    forking: false,
    onSave: noop,
    onFork: noop,
    onNew: noop,
    onShareButtonClick: noop,
    snippet: null as Revision | null,
};

test('SnippetButton: renders Snippet label in span', (t) => {
    render(
        <SnippetButton {...defaultProps}/>,
    );
    
    const span = document.querySelector('.menuButton > span');
    
    cleanup();
    const result = span?.textContent.includes('Snippet') || false;
    
    t.ok(result);
    t.end();
});

test('SnippetButton: renders four list items', (t) => {
    render(
        <SnippetButton {...defaultProps}/>,
    );
    fireEvent.click(document.querySelector('.menuButton > span')!);
    
    const items = document.querySelectorAll('[data-testid="snippet-menu"] > li');
    
    cleanup();
    
    t.equal(items.length, 4);
    t.end();
});

test('SnippetButton: clicking span opens menu', (t) => {
    render(
        <SnippetButton {...defaultProps}/>,
    );
    
    fireEvent.click(document.querySelector('.menuButton > span')!);
    const result = document.querySelector('[data-testid="snippet-menu"]');
    
    cleanup();
    t.ok(result);
    t.end();
});

test('SnippetButton: clicking ul closes menu', (t) => {
    render(
        <SnippetButton {...defaultProps}/>,
    );
    fireEvent.click(document.querySelector('.menuButton > span')!);
    
    fireEvent.click(document.querySelector('[data-testid="snippet-menu"]')!);
    const result = document.querySelector('[data-testid="snippet-menu"]');
    
    cleanup();
    t.notOk(result);
    t.end();
});

test('SnippetButton: second span click closes menu', (t) => {
    render(
        <SnippetButton {...defaultProps}/>,
    );
    const span = document.querySelector('.menuButton > span')!;
    
    fireEvent.click(span);
    fireEvent.click(span);
    const result = document.querySelector('[data-testid="snippet-menu"]');
    
    cleanup();
    t.notOk(result);
    t.end();
});

test('SnippetButton: quick-save button title is Save when canSave and not canFork', (t) => {
    render(
        <SnippetButton {...defaultProps} canSave={true} canFork={false}/>,
    );
    
    const btn = document.querySelector('.menuButton > button') as HTMLButtonElement | null;
    
    cleanup();
    
    t.equal(btn?.title, 'Save');
    t.end();
});

test('SnippetButton: quick-save button title is Fork when canFork and not canSave', (t) => {
    render(
        <SnippetButton {...defaultProps} canSave={false} canFork={true}/>,
    );
    
    const btn = document.querySelector('.menuButton > button') as HTMLButtonElement | null;
    
    cleanup();
    
    t.equal(btn?.title, 'Fork');
    t.end();
});

test('SnippetButton: quick-save button disabled when saving', (t) => {
    render(
        <SnippetButton {...defaultProps} saving={true}/>,
    );
    
    const btn = document.querySelector('.menuButton > button') as HTMLButtonElement | null;
    
    cleanup();
    
    t.ok(btn?.disabled);
    t.end();
});

test('SnippetButton: quick-save button disabled when forking', (t) => {
    render(
        <SnippetButton {...defaultProps} forking={true}/>,
    );
    
    const btn = document.querySelector('.menuButton > button') as HTMLButtonElement | null;
    
    cleanup();
    
    t.ok(btn?.disabled);
    t.end();
});

test('SnippetButton: quick-save button disabled when neither canSave nor canFork', (t) => {
    render(
        <SnippetButton {...defaultProps} canSave={false} canFork={false}/>,
    );
    
    const btn = document.querySelector('.menuButton > button') as HTMLButtonElement | null;
    
    cleanup();
    
    t.ok(btn?.disabled);
    t.end();
});

test('SnippetButton: quick-save button calls onSave when canSave', (t) => {
    let saved = false;
    
    render(
        <SnippetButton
            {...defaultProps}
            canSave={true}
            canFork={false}
            onSave={() => {
                saved = true;
            }}
        />,
    );
    
    fireEvent.click(document.querySelector('.menuButton > button')!);
    
    cleanup();
    
    t.ok(saved);
    t.end();
});

test('SnippetButton: quick-save button calls onFork when canFork and not canSave', (t) => {
    let forked = false;
    
    render(
        <SnippetButton
            {...defaultProps}
            canSave={false}
            canFork={true}
            onFork={() => {
                forked = true;
            }}
        />,
    );
    
    fireEvent.click(document.querySelector('.menuButton > button')!);
    
    cleanup();
    
    t.ok(forked);
    t.end();
});

test('SnippetButton: renders trigger file svg icon', (t) => {
    render(
        <SnippetButton {...defaultProps}/>,
    );
    
    const svg = document.querySelector('.menuButton > span svg');
    
    cleanup();
    
    t.ok(svg, 'trigger file icon svg rendered');
    t.end();
});

test('SnippetButton: renders action svg icon when saving', (t) => {
    render(
        <SnippetButton {...defaultProps} saving={true}/>,
    );
    
    const svg = document.querySelector('.menuButton > button svg');
    
    cleanup();
    
    t.ok(svg, 'spinner icon svg rendered');
    t.end();
});

test('SnippetButton: renders fork svg icon when canFork and not canSave and not saving/forking', (t) => {
    render(
        <SnippetButton {...defaultProps} canSave={false} canFork={true} saving={false} forking={false}/>,
    );
    
    const svg = document.querySelector('.menuButton > button svg');
    
    cleanup();
    
    t.ok(svg, 'fork icon svg rendered');
    t.end();
});

test('SnippetButton: renders save svg icon when canSave and not saving/forking', (t) => {
    render(
        <SnippetButton {...defaultProps} canSave={true} canFork={false} saving={false} forking={false}/>,
    );
    
    const svg = document.querySelector('.menuButton > button svg');
    
    cleanup();
    
    t.ok(svg, 'save icon svg rendered');
    t.end();
});
