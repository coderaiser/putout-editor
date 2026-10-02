import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import type {FlatNode} from '@putout/editor-commands';
import AstStatus from './AstStatus.tsx';

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

const node = (over: Partial<FlatNode> = {}): FlatNode => ({
    id: '0',
    pid: null,
    depth: 0,
    type: 'BinaryExpression',
    detail: '',
    line: 2,
    col: 9,
    endLine: 2,
    endCol: 14,
    ...over,
});

const status = (selected: FlatNode | null, hidden = 0) => render(
    <AstStatus
        hidden={hidden}
        selected={selected}
    />,
);

test('AstStatus: shows the selected type', (t) => {
    status(node());
    
    const result = read('.ast-status__type');
    const expected = 'BinaryExpression';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows the start and end positions', (t) => {
    status(node());
    
    const result = read('.ast-status__pos');
    const expected = 'start 2:9   end 2:14';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows a dash for the type when nothing is selected', (t) => {
    status(null);
    
    const result = read('.ast-status__type');
    const expected = '—';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows a dash for the position when nothing is selected', (t) => {
    status(null);
    
    const result = read('.ast-status__pos');
    const expected = '—';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows the hidden count when rows are collapsed', (t) => {
    status(node(), 3);
    
    const result = read('.ast-status__hidden');
    const expected = '3 hidden';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: omits the hidden count when nothing is collapsed', (t) => {
    status(node(), 0);
    
    const result = document.querySelector('.ast-status__hidden');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: carries the status testid', (t) => {
    status(null);
    
    const result = document.querySelector('[data-testid="ast-status"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstStatus: shows the key hints', (t) => {
    status(null);
    
    const result = read('.ast-status__help');
    const expected = '↑↓/jk navigate · space/enter expand · / search · tab switch';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
