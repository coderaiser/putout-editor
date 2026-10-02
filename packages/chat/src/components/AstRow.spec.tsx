import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import type {FlatNode} from '@putout/editor-commands';
import AstRow, {caretOf, connectorsOf} from './AstRow.tsx';

const read = (selector: string) => {
    const element = document.querySelector(selector);
    
    return element && element.textContent;
};

const noop = () => {};

const node = (over: Partial<FlatNode> = {}): FlatNode => ({
    id: '0',
    pid: null,
    depth: 0,
    type: 'Program',
    detail: '',
    line: 1,
    col: 0,
    endLine: 1,
    endCol: 10,
    ...over,
});

const row = (over: Partial<FlatNode> = {}) => render(
    <AstRow
        hasChildren={false}
        collapsed={false}
        dimmed={false}
        last={false}
        node={node(over)}
        onSelect={noop}
        onToggle={noop}
        selected={false}
    />,
);

test('AstRow: depth 0 carries no connectors', (t) => {
    const result = connectorsOf(0, false);
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: a non-last child gets the tee', (t) => {
    const result = connectorsOf(1, false);
    const expected = '├─ ';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: a last child gets the elbow', (t) => {
    const result = connectorsOf(1, true);
    const expected = '└─ ';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: depth 2 indents one group before its connector', (t) => {
    const result = connectorsOf(2, false);
    const expected = '   ├─ ';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: depth 3 indents two groups', (t) => {
    const result = connectorsOf(3, true);
    const expected = '      └─ ';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: an expanded node shows the open caret', (t) => {
    const result = caretOf(true, false);
    const expected = '▾';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: a collapsed node shows the closed caret', (t) => {
    const result = caretOf(true, true);
    const expected = '▸';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: a leaf shows two spaces, not a caret', (t) => {
    const result = caretOf(false, false);
    const expected = '  ';
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: renders the node type', (t) => {
    row({
        type: 'Identifier',
    });
    
    const expected = 'Identifier';
    const result = read('[data-testid="ast-row"]');
    
    cleanup();
    
    t.equal(result && result.includes(expected), true);
    t.end();
});

test('AstRow: renders a detail when there is one', (t) => {
    row({
        detail: '"a"',
    });
    
    const expected = '"a"';
    const result = read('.ast-row__detail');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: omits the detail element when empty', (t) => {
    row();
    
    const result = document.querySelector('.ast-row__detail');
    const expected = null;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: renders the line:col', (t) => {
    row({
        line: 2,
        col: 7,
    });
    
    const expected = '2:7';
    const result = read('.ast-row__pos');
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: carries the selected class', (t) => {
    render(
        <AstRow
            hasChildren={false}
            collapsed={false}
            dimmed={false}
            last={false}
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected={true}
        />,
    );
    
    const result = document.querySelector('.ast-row--selected') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: carries the dimmed class for an ancestor of a match', (t) => {
    render(
        <AstRow
            hasChildren={false}
            collapsed={false}
            dimmed={true}
            last={false}
            node={node()}
            onSelect={noop}
            onToggle={noop}
            selected={false}
        />,
    );
    
    const result = document.querySelector('.ast-row--dimmed') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('AstRow: clicking reports the id', (t) => {
    const picked: string[] = [];
    const onSelect = (id: string) => {
        picked.push(id);
    };
    
    render(
        <AstRow
            hasChildren={false}
            collapsed={false}
            dimmed={false}
            last={false}
            node={node({
                id: '7',
            })}
            onSelect={onSelect}
            onToggle={noop}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="ast-row"]') as Element);
    
    cleanup();
    
    const expected = ['7'];
    const result = picked;
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstRow: clicking a node with children also folds it', (t) => {
    const toggled: string[] = [];
    const onToggle = (id: string) => {
        toggled.push(id);
    };
    
    render(
        <AstRow
            hasChildren={true}
            collapsed={false}
            dimmed={false}
            last={false}
            node={node({
                id: '2',
            })}
            onSelect={noop}
            onToggle={onToggle}
            selected={false}
        />,
    );
    
    fireEvent.click(document.querySelector('[data-testid="ast-row"]') as Element);
    
    cleanup();
    
    const expected = ['2'];
    const result = toggled;
    
    t.deepEqual(result, expected);
    t.end();
});

test('AstRow: indents by depth', (t) => {
    row({
        depth: 3,
    });
    
    const result = (document.querySelector('[data-testid="ast-row"]') as HTMLElement).style.paddingLeft;
    const expected = '36px';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
