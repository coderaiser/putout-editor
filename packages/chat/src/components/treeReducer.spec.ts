import {test} from 'supertape';
import type {FlatNode} from '@putout/editor-commands';
import {
    node,
    sorted,
    textOf,
    tree,
} from '#test/tree';
import type {TreeState} from './treeModel.ts';
import {
    createTreeState,
    treeReducer,
} from './treeReducer.ts';

const stateOf = (overrides: Partial<TreeState> = {}): TreeState => ({
    collapsed: new Set(),
    selected: null,
    query: '',
    focus: 'tree',
    ...overrides,
});

const move = (step: number, nodes: FlatNode[] = tree) => ({
    kind: 'move' as const,
    step,
    nodes,
    textOf,
});

test('treeReducer: createTreeState folds everything below depth 1', (t) => {
    const {collapsed} = createTreeState(tree, 1);
    
    const result = sorted(collapsed);
    const expected = [
        '2',
        '3',
        '4',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeReducer: createTreeState with depth 0 folds the first level too', (t) => {
    const {collapsed} = createTreeState(tree, 0);
    
    const result = sorted(collapsed);
    const expected = [
        '1',
        '2',
        '3',
        '4',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeReducer: createTreeState starts with nothing selected, no query, and the tree focused', (t) => {
    const {
        selected,
        query,
        focus,
    } = createTreeState(tree, 1);
    
    const result = {
        selected,
        query,
        focus,
    };
    
    const expected = {
        selected: null,
        query: '',
        focus: 'tree',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeReducer: toggle folds an open node', (t) => {
    const state = stateOf();
    const {collapsed} = treeReducer(state, {
        kind: 'toggle',
        id: '1',
    });
    
    const result = sorted(collapsed);
    const expected = ['1'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeReducer: toggle opens a folded node', (t) => {
    const state = stateOf({
        collapsed: new Set(['1', '2']),
    });
    
    const {collapsed} = treeReducer(state, {
        kind: 'toggle',
        id: '1',
    });
    
    const result = sorted(collapsed);
    const expected = ['2'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeReducer: toggle does not change the old set', (t) => {
    const collapsed = new Set(['1']);
    
    treeReducer(stateOf({
        collapsed,
    }), {
        kind: 'toggle',
        id: '1',
    });
    
    const result = sorted(collapsed);
    const expected = ['1'];
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeReducer: select sets the selection', (t) => {
    const {selected} = treeReducer(stateOf(), {
        kind: 'select',
        id: '3',
    });
    
    const result = selected;
    const expected = '3';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: fold toggles the node and selects it', (t) => {
    const {collapsed, selected} = treeReducer(stateOf(), {
        kind: 'fold',
        id: '1',
    });
    
    const result = {
        collapsed: sorted(collapsed),
        selected,
    };
    
    const expected = {
        collapsed: ['1'],
        selected: '1',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeReducer: query sets the query', (t) => {
    const {query} = treeReducer(stateOf(), {
        kind: 'query',
        query: 'Identifier',
    });
    
    const result = query;
    const expected = 'Identifier';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: focus sets the focus', (t) => {
    const {focus} = treeReducer(stateOf(), {
        kind: 'focus',
        focus: 'search',
    });
    
    const result = focus;
    const expected = 'search';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: leave clears the query and returns the focus to the tree', (t) => {
    const {query, focus} = treeReducer(stateOf({
        query: 'Identifier',
        focus: 'search',
    }), {
        kind: 'leave',
    });
    
    const result = {
        query,
        focus,
    };
    
    const expected = {
        query: '',
        focus: 'tree',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('treeReducer: leave keeps the selection', (t) => {
    const {selected} = treeReducer(stateOf({
        selected: '3',
        focus: 'search',
    }), {
        kind: 'leave',
    });
    
    const result = selected;
    const expected = '3';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move with nothing selected takes the first row', (t) => {
    const {selected} = treeReducer(stateOf(), move(1));
    
    const result = selected;
    const expected = '0';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move with nothing selected takes the first row on a step back too', (t) => {
    const {selected} = treeReducer(stateOf(), move(-1));
    
    const result = selected;
    const expected = '0';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move steps down one row', (t) => {
    const {selected} = treeReducer(stateOf({
        selected: '0',
    }), move(1));
    
    const result = selected;
    const expected = '1';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move steps up one row', (t) => {
    const {selected} = treeReducer(stateOf({
        selected: '1',
    }), move(-1));
    
    const result = selected;
    const expected = '0';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move stops at the last row', (t) => {
    const {selected} = treeReducer(stateOf({
        selected: '4',
    }), move(1));
    
    const result = selected;
    const expected = '4';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move stops at the first row', (t) => {
    const {selected} = treeReducer(stateOf({
        selected: '0',
    }), move(-1));
    
    const result = selected;
    const expected = '0';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move skips the rows a fold hides', (t) => {
    const {selected} = treeReducer(stateOf({
        selected: '1',
        collapsed: new Set(['1']),
    }), move(1));
    
    const result = selected;
    const expected = '1';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move walks the rows a query leaves', (t) => {
    const {selected} = treeReducer(stateOf({
        selected: '2',
        query: 'Identifier',
    }), move(1));
    
    const result = selected;
    const expected = '3';
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move on an empty tree returns the same state', (t) => {
    const state = stateOf();
    
    const result = treeReducer(state, move(1, []));
    const expected = state;
    
    t.equal(result, expected);
    t.end();
});

test('treeReducer: move uses the text accessor it is given', (t) => {
    const nodes = [
        node('0', null, 0, 'Root'),
        node('1', '0', 1, 'Alpha'),
        node('2', '0', 1, 'Beta'),
    ];
    
    const {selected} = treeReducer(stateOf({
        selected: '0',
        query: 'beta',
    }), {
        kind: 'move',
        step: 1,
        nodes,
        textOf: ({type}) => type,
    });
    
    const result = selected;
    const expected = '2';
    
    t.equal(result, expected);
    t.end();
});
