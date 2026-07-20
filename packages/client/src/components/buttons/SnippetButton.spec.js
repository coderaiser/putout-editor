import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import SnippetButton from './SnippetButton.js';

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
    snippet: null,
};

test('SnippetButton: renders Snippet label in span', (t) => {
    render(<SnippetButton {...defaultProps}/>);
    
    const span = document.querySelector('.menuButton > span');
    
    cleanup();
    
    t.ok(span.textContent.includes('Snippet'));
    t.end();
});

test('SnippetButton: renders four list items', (t) => {
    render(<SnippetButton {...defaultProps}/>);
    
    const items = document.querySelectorAll('ul > li');
    
    cleanup();
    
    t.equal(items.length, 4);
    t.end();
});

test('SnippetButton: clicking span sets is-closed class', (t) => {
    render(<SnippetButton {...defaultProps}/>);
    
    const div = document.querySelector('.menuButton');
    const span = document.querySelector('.menuButton > span');
    
    fireEvent.click(span);
    
    const result = div.className.includes('is-closed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('SnippetButton: clicking ul sets is-closed class', (t) => {
    render(<SnippetButton {...defaultProps}/>);
    
    const div = document.querySelector('.menuButton');
    const ul = document.querySelector('ul');
    
    fireEvent.click(ul);
    
    const result = div.className.includes('is-closed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('SnippetButton: mouseleave clears is-closed class', (t) => {
    render(<SnippetButton {...defaultProps}/>);
    
    const div = document.querySelector('.menuButton');
    const span = document.querySelector('.menuButton > span');
    
    fireEvent.click(span);
    fireEvent.mouseLeave(div);
    
    const result = div.className.includes('is-closed');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('SnippetButton: quick-save button title is Save when canSave and not canFork', (t) => {
    render(<SnippetButton {...defaultProps} canSave={true} canFork={false}/>);
    
    const btn = document.querySelector('.menuButton > button');
    
    cleanup();
    
    t.equal(btn.title, 'Save');
    t.end();
});

test('SnippetButton: quick-save button title is Fork when canFork and not canSave', (t) => {
    render(<SnippetButton {...defaultProps} canSave={false} canFork={true}/>);
    
    const btn = document.querySelector('.menuButton > button');
    
    cleanup();
    
    t.equal(btn.title, 'Fork');
    t.end();
});

test('SnippetButton: quick-save button disabled when saving', (t) => {
    render(<SnippetButton {...defaultProps} saving={true}/>);
    
    const btn = document.querySelector('.menuButton > button');
    
    cleanup();
    
    t.ok(btn.disabled);
    t.end();
});

test('SnippetButton: quick-save button disabled when forking', (t) => {
    render(<SnippetButton {...defaultProps} forking={true}/>);
    
    const btn = document.querySelector('.menuButton > button');
    
    cleanup();
    
    t.ok(btn.disabled);
    t.end();
});

test('SnippetButton: quick-save button disabled when neither canSave nor canFork', (t) => {
    render(<SnippetButton {...defaultProps} canSave={false} canFork={false}/>);
    
    const btn = document.querySelector('.menuButton > button');
    
    cleanup();
    
    t.ok(btn.disabled);
    t.end();
});

test('SnippetButton: quick-save button calls onSave when canSave', (t) => {
    let saved = false;
    
    render(<SnippetButton {...defaultProps} canSave={true} canFork={false} onSave={() => { saved = true; }}/>);
    
    fireEvent.click(document.querySelector('.menuButton > button'));
    
    cleanup();
    
    t.ok(saved);
    t.end();
});

test('SnippetButton: quick-save button calls onFork when canFork and not canSave', (t) => {
    let forked = false;
    
    render(<SnippetButton {...defaultProps} canSave={false} canFork={true} onFork={() => { forked = true; }}/>);
    
    fireEvent.click(document.querySelector('.menuButton > button'));
    
    cleanup();
    
    t.ok(forked);
    t.end();
});

test('SnippetButton: fa-spinner icon shown when saving', (t) => {
    render(<SnippetButton {...defaultProps} saving={true}/>);
    
    const icon = document.querySelector('.fa-spinner');
    
    cleanup();
    
    t.ok(icon);
    t.end();
});

test('SnippetButton: fa-code-fork icon shown when canFork and not canSave and not saving/forking', (t) => {
    render(<SnippetButton {...defaultProps} canSave={false} canFork={true} saving={false} forking={false}/>);
    
    const icon = document.querySelector('.fa-code-fork');
    
    cleanup();
    
    t.ok(icon);
    t.end();
});

test('SnippetButton: fa-floppy-o icon shown when canSave and not saving/forking', (t) => {
    render(<SnippetButton {...defaultProps} canSave={true} canFork={false} saving={false} forking={false}/>);
    
    const icon = document.querySelector('.fa-floppy-o');
    
    cleanup();
    
    t.ok(icon);
    t.end();
});
