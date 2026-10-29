import type {Block, Succ} from '@putout/flow';

export const PAD = 12;
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 28;
export const GAP = 28;
export const LANE = 24;
export const MAX_LANES = 3;

type NodeId = number | 'exit';

export interface FlowNode {
    id: NodeId;
    label: string;
    x: number;
    y: number;
    terminal: boolean;
    unreachable: boolean;
}

export interface FlowEdge {
    from: number;
    to: NodeId;
    label: string;
    path: string;
    labelX: number;
    labelY: number;
}

export interface FlowLayout {
    width: number;
    height: number;
    nodes: FlowNode[];
    edges: FlowEdge[];
}

const toExit = ({id}: Succ) => id === 'exit';
const hasExitEdge = ({succs}: Block) => succs.some(toExit);
const yOf = (row: number) => PAD + row * (NODE_HEIGHT + GAP);
const clamp = (span: number) => Math.min(Math.max(span, 1), MAX_LANES);

const nodeOf = (block: Block, row: number): FlowNode => ({
    id: block.id,
    label: `block ${block.id}`,
    x: PAD,
    y: yOf(row),
    terminal: Boolean(block.terminal),
    unreachable: Boolean(block.unreachable),
});

const exitOf = (row: number): FlowNode => ({
    id: 'exit',
    label: 'exit',
    x: PAD,
    y: yOf(row),
    terminal: false,
    unreachable: false,
});

/**
 * The path for one edge. The next row is a straight line down from the bottom
 * centre. Any other row (a skip, a loop back, a loop to itself) is a curve out
 * of the right side and back, and a longer jump uses a wider lane, up to
 * `MAX_LANES`, so the width never depends on the number of blocks.
 */
const pathOf = (fromRow: number, toRow: number): Omit<FlowEdge, 'from' | 'to' | 'label'> => {
    if (toRow === fromRow + 1) {
        const cx = PAD + NODE_WIDTH / 2;
        const y1 = yOf(fromRow) + NODE_HEIGHT;
        const y2 = yOf(toRow);
        
        return {
            path: `M ${cx} ${y1} L ${cx} ${y2}`,
            labelX: cx + 4,
            labelY: y1 + GAP / 2,
        };
    }
    
    const x = PAD + NODE_WIDTH;
    const bulge = x + LANE * clamp(Math.abs(toRow - fromRow));
    const y1 = yOf(fromRow) + NODE_HEIGHT / 2;
    const y2 = yOf(toRow) + NODE_HEIGHT / 2;
    
    return {
        path: `M ${x} ${y1} C ${bulge} ${y1}, ${bulge} ${y2}, ${x} ${y2}`,
        labelX: x + 4,
        labelY: y1 - 4,
    };
};

/**
 * Lay the graph out top to bottom: one block per row, in order, then an `exit`
 * row when any edge goes to `exit`. The width is fixed, so the SVG can scale
 * to its pane with `viewBox` and never needs a horizontal scroll.
 */
export const layoutOf = (blocks: Block[]): FlowLayout => {
    const rows = new Map(blocks.map(({id}, row) => [id, row]));
    const exitRow = blocks.length;
    const rowOf = (id: NodeId) => id === 'exit' ? exitRow : rows.get(id) as number;
    
    const nodes = blocks.map(nodeOf);
    
    if (blocks.some(hasExitEdge))
        nodes.push(exitOf(exitRow));
    
    const edges: FlowEdge[] = [];
    
    for (const [row, block] of blocks.entries()) {
        for (const succ of block.succs)
            edges.push({
                from: block.id,
                to: succ.id,
                label: succ.label || '',
                ...pathOf(row, rowOf(succ.id)),
            });
    }
    
    const lastY = yOf(nodes.length - 1);
    
    return {
        width: PAD * 2 + NODE_WIDTH + LANE * MAX_LANES,
        height: lastY + NODE_HEIGHT + PAD,
        nodes,
        edges,
    };
};
