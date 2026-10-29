import {test} from 'supertape';
import type {Block} from '@putout/flow';
import {
    type FlowNode,
    GAP,
    LANE,
    MAX_LANES,
    NODE_HEIGHT,
    NODE_WIDTH,
    PAD,
    layoutOf,
} from './flowLayout.ts';

const ifElse: Block[] = [{
    id: 0,
    stmts: ['x ?'],
    succs: [{
        id: 1,
        label: 'true',
    }, {
        id: 2,
        label: 'false',
    }],
}, {
    id: 1,
    stmts: ['return a;'],
    succs: [{
        id: 'exit',
    }],
    terminal: true,
}, {
    id: 2,
    stmts: ['return b;'],
    succs: [{
        id: 'exit',
    }],
    terminal: true,
}];

const rowY = (row: number) => PAD + row * (NODE_HEIGHT + GAP);

test('flowLayout: blocks go down one row each, exit last', (t) => {
    const result: [FlowNode['id'], number][] = [];
    
    for (const {id, y} of layoutOf(ifElse).nodes) {
        result.push([id, y]);
    }
    
    const expected = [
        [0, rowY(0)],
        [1, rowY(1)],
        [2, rowY(2)],
        ['exit', rowY(3)],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flowLayout: every node is in the left column', (t) => {
    const xs = new Set(layoutOf(ifElse).nodes.map(({x}) => x));
    const result = [...xs];
    const expected = [PAD];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flowLayout: the width holds the nodes and the side lanes', (t) => {
    const result = layoutOf(ifElse).width;
    const expected = PAD * 2 + NODE_WIDTH + LANE * MAX_LANES;
    
    t.equal(result, expected);
    t.end();
});

test('flowLayout: the height holds every row', (t) => {
    const result = layoutOf(ifElse).height;
    const expected = rowY(3) + NODE_HEIGHT + PAD;
    
    t.equal(result, expected);
    t.end();
});

test('flowLayout: the width does not grow with the number of blocks', (t) => {
    const many: Block[] = Array.from({length: 20}, (_, id) => ({
        id,
        stmts: [],
        succs: [{
            id: id + 1,
        }],
    }));
    
    const result = layoutOf(many).width;
    const expected = layoutOf(ifElse).width;
    
    t.equal(result, expected);
    t.end();
});

test('flowLayout: an edge to the next row is a straight line down', (t) => {
    const [edge] = layoutOf(ifElse).edges;
    const cx = PAD + NODE_WIDTH / 2;
    const result = edge.path;
    const expected = `M ${cx} ${rowY(0) + NODE_HEIGHT} L ${cx} ${rowY(1)}`;
    
    t.equal(result, expected);
    t.end();
});

test('flowLayout: an edge that skips rows curves on the right', (t) => {
    const [, edge] = layoutOf(ifElse).edges;
    const x = PAD + NODE_WIDTH;
    const bulge = x + LANE * 2;
    const y1 = rowY(0) + NODE_HEIGHT / 2;
    const y2 = rowY(2) + NODE_HEIGHT / 2;
    const result = edge.path;
    const expected = `M ${x} ${y1} C ${bulge} ${y1}, ${bulge} ${y2}, ${x} ${y2}`;
    
    t.equal(result, expected);
    t.end();
});

test('flowLayout: a side lane never goes past the last lane', (t) => {
    const far: Block[] = [{
        id: 0,
        stmts: [],
        succs: [{
            id: 9,
        }],
    },
    ...Array.from({length: 9}, (_, index) => ({
        id: index + 1,
        stmts: [],
        succs: [],
    }))];
    
    const [edge] = layoutOf(far).edges;
    const bulge = PAD + NODE_WIDTH + LANE * MAX_LANES;
    const result = edge.path.includes(`C ${bulge} `);
    
    t.ok(result);
    t.end();
});

test('flowLayout: a loop back to the same block gets one lane', (t) => {
    const loop: Block[] = [{
        id: 0,
        stmts: [],
        succs: [{
            id: 0,
        }],
    }];
    
    const [edge] = layoutOf(loop).edges;
    const bulge = PAD + NODE_WIDTH + LANE;
    const result = edge.path.includes(`C ${bulge} `);
    
    t.ok(result);
    t.end();
});

test('flowLayout: an edge keeps its label', (t) => {
    const result: string[] = [];
    
    for (const {label} of layoutOf(ifElse).edges) {
        result.push(label);
    }
    
    const expected = [
        'true',
        'false',
        '',
        '',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flowLayout: a node keeps terminal and unreachable', (t) => {
    const blocks: Block[] = [{
        id: 0,
        stmts: ['return a;'],
        succs: [{
            id: 'exit',
        }],
        terminal: true,
    }, {
        id: 1,
        stmts: ['b();'],
        succs: [],
        unreachable: true,
    }];
    
    const result: [
        boolean,
        boolean,
    ][] = [];
    
    for (const {terminal, unreachable} of layoutOf(blocks).nodes) {
        result.push([terminal, unreachable]);
    }
    
    const expected = [
        [true, false],
        [false, true],
        [false, false],
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flowLayout: no exit node when no edge goes to exit', (t) => {
    const blocks: Block[] = [{
        id: 0,
        stmts: [],
        succs: [],
    }];
    
    const result: FlowNode['id'][] = [];
    
    for (const {id} of layoutOf(blocks).nodes) {
        result.push(id);
    }
    
    const expected = [0];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flowLayout: a node is labelled block N, and exit is exit', (t) => {
    const result: string[] = [];
    
    for (const {label} of layoutOf(ifElse).nodes) {
        result.push(label);
    }
    
    const expected = [
        'block 0',
        'block 1',
        'block 2',
        'exit',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
