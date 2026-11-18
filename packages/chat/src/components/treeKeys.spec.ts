import {test} from 'supertape';
import type {FlatNode} from '@putout/editor-commands';
import {textOf, tree} from '#test/tree';
import {keyToAction, type KeyContext} from './treeKeys.ts';

const contextOf = (overrides: Partial<KeyContext<FlatNode>> = {}): KeyContext<FlatNode> => ({
    nodes: tree,
    collapsed: new Set(),
    selected: null,
    query: '',
    focus: 'tree',
    textOf,
    canOpen: false,
    ...overrides,
});

const none = {
    action: null,
    open: null,
    prevent: false,
    focusRoot: false,
};

const move = (step: number, nodes: FlatNode[] = tree) => ({
    ...none,
    action: {
        kind: 'move',
        step,
        nodes,
        textOf,
    },
});

const act = (action: object, overrides: object = {}) => ({
    ...none,
    action,
    ...overrides,
});

const leave = act({
    kind: 'leave',
}, {
    prevent: true,
    focusRoot: true,
});

test('treeKeys: Escape in the filter leaves it', (t) => {
    const result = keyToAction('Escape', contextOf({
        focus: 'search',
    }));
    
    const expected = leave;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: k in the filter leaves it', (t) => {
    const result = keyToAction('k', contextOf({
        focus: 'search',
    }));
    
    const expected = leave;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowUp in the filter leaves it', (t) => {
    const result = keyToAction('ArrowUp', contextOf({
        focus: 'search',
    }));
    
    const expected = leave;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Tab in the filter leaves it', (t) => {
    const result = keyToAction('Tab', contextOf({
        focus: 'search',
    }));
    
    const expected = leave;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: a letter in the filter does nothing', (t) => {
    const result = keyToAction('j', contextOf({
        focus: 'search',
    }));
    
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Enter in the filter does nothing', (t) => {
    const result = keyToAction('Enter', contextOf({
        focus: 'search',
        selected: '1',
    }));
    
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Tab in the tree goes to the filter, and the browser does not', (t) => {
    const result = keyToAction('Tab', contextOf());
    
    const expected = act({
        kind: 'focus',
        focus: 'search',
    }, {
        prevent: true,
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowDown moves one row down', (t) => {
    const result = keyToAction('ArrowDown', contextOf());
    const expected = move(1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: j moves one row down', (t) => {
    const result = keyToAction('j', contextOf());
    const expected = move(1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowUp below the first row moves one row up', (t) => {
    const result = keyToAction('ArrowUp', contextOf({
        selected: '2',
    }));
    
    const expected = move(-1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: k below the first row moves one row up', (t) => {
    const result = keyToAction('k', contextOf({
        selected: '2',
    }));
    
    const expected = move(-1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: k on the first row goes to the filter', (t) => {
    const result = keyToAction('k', contextOf({
        selected: '0',
    }));
    
    const expected = act({
        kind: 'focus',
        focus: 'search',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowUp on the first row goes to the filter', (t) => {
    const result = keyToAction('ArrowUp', contextOf({
        selected: '0',
    }));
    
    const expected = act({
        kind: 'focus',
        focus: 'search',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: k with nothing selected moves, it does not go to the filter', (t) => {
    const result = keyToAction('k', contextOf());
    const expected = move(-1);
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: k on an empty tree moves, it does not go to the filter', (t) => {
    const result = keyToAction('k', contextOf({
        nodes: [],
    }));
    
    const expected = move(-1, []);
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowRight on a folded node folds it open where it stands', (t) => {
    const result = keyToAction('ArrowRight', contextOf({
        selected: '1',
        collapsed: new Set(['1']),
    }));
    
    const expected = act({
        kind: 'fold',
        id: '1',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: l on an open node walks to its first child', (t) => {
    const result = keyToAction('l', contextOf({
        selected: '1',
    }));
    
    const expected = act({
        kind: 'select',
        id: '2',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowRight with nothing selected takes the first row', (t) => {
    const result = keyToAction('ArrowRight', contextOf());
    
    const expected = act({
        kind: 'select',
        id: '0',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowRight on a leaf does nothing', (t) => {
    const result = keyToAction('ArrowRight', contextOf({
        selected: '4',
    }));
    
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowLeft on an open node folds it', (t) => {
    const result = keyToAction('ArrowLeft', contextOf({
        selected: '1',
    }));
    
    const expected = act({
        kind: 'fold',
        id: '1',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: h on a folded node walks out to its parent', (t) => {
    const result = keyToAction('h', contextOf({
        selected: '1',
        collapsed: new Set(['1']),
    }));
    
    const expected = act({
        kind: 'select',
        id: '0',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: ArrowLeft with nothing selected does nothing', (t) => {
    const result = keyToAction('ArrowLeft', contextOf());
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Enter on a container toggles it', (t) => {
    const result = keyToAction('Enter', contextOf({
        selected: '1',
    }));
    
    const expected = act({
        kind: 'toggle',
        id: '1',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Space on a container toggles it', (t) => {
    const result = keyToAction(' ', contextOf({
        selected: '1',
    }));
    
    const expected = act({
        kind: 'toggle',
        id: '1',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Enter with nothing selected does nothing', (t) => {
    const result = keyToAction('Enter', contextOf());
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Enter on a leaf opens it when the caller can open', (t) => {
    const result = keyToAction('Enter', contextOf({
        selected: '4',
        canOpen: true,
    }));
    
    const expected = {
        ...none,
        open: tree[4],
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Enter on a leaf toggles it when the caller cannot open', (t) => {
    const result = keyToAction('Enter', contextOf({
        selected: '4',
    }));
    
    const expected = act({
        kind: 'toggle',
        id: '4',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Enter on a container toggles it even when the caller can open', (t) => {
    const result = keyToAction('Enter', contextOf({
        selected: '1',
        canOpen: true,
    }));
    
    const expected = act({
        kind: 'toggle',
        id: '1',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: Enter on an id that is not in the tree opens nothing', (t) => {
    const result = keyToAction('Enter', contextOf({
        selected: 'gone',
        canOpen: true,
    }));
    
    const expected = act({
        kind: 'toggle',
        id: 'gone',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: slash goes to the filter', (t) => {
    const result = keyToAction('/', contextOf());
    
    const expected = act({
        kind: 'focus',
        focus: 'search',
    });
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeKeys: another key does nothing', (t) => {
    const result = keyToAction('x', contextOf());
    const expected = none;
    
    t.deepEqual(result, expected);
    t.end();
});
