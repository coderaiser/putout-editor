import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import type {FlatNode} from '@putout/editor-commands';
import ConsolePanel from './ConsolePanel.tsx';

const node = (id: string): FlatNode => ({
    id,
    pid: null,
    depth: 0,
    type: 'Program',
    detail: '',
    line: 1,
    col: 0,
    endLine: 1,
    endCol: 10,
});

const panel = (nodes: FlatNode[] | null) => render(
    <ConsolePanel
        ast={nodes && {
            nodes,
            source: 'const a = 1;',
        }}
    />,
);

test('ConsolePanel: no ast says so rather than showing a blank box', (t) => {
    panel(null);
    
    const element = document.querySelector('[data-testid="console-panel"]');
    const result = element && element.textContent;
    const expected = 'Run /ast to populate the tree';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ConsolePanel: a populated panel renders the tree', (t) => {
    panel([
        node('0'),
    ]);
    
    const result = document.querySelectorAll('[data-testid="ast-row"]').length;
    const expected = 1;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

test('ConsolePanel: the empty panel draws no tree', (t) => {
    panel(null);
    
    const result = document.querySelectorAll('[data-testid="ast-row"]').length;
    const expected = 0;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
