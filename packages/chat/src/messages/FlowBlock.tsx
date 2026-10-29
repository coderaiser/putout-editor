import '../css/highlight.css';
import './FlowBlock.css';
import {
    findUnreachable,
    type Block,
} from '@putout/flow';
import {highlight} from '../highlight.ts';
import {
    layoutOf,
    NODE_HEIGHT,
    NODE_WIDTH,
} from './flowLayout.ts';

export interface FlowBlockProps {
    blocks: Block[];
    source: string;
    onNavigate?(line: number): void;
}

/**
 * The `/flow` answer: the source, and its control-flow graph below it.
 *
 * Source panel: line-numbered like `SourceBlock`. A line gets `data-unreachable`
 * when no path reaches its block, and `data-duplicate` when two blocks share its
 * text. A click calls `onNavigate` with the line number.
 *
 * Graph panel: an inline SVG drawn from `layoutOf` (`flowLayout.ts`), one block
 * per row, top to bottom. The SVG has a fixed-width `viewBox` and scales to the
 * pane, so it never scrolls sideways. Colours come from `FlowBlock.css`, never
 * from attributes: an unknown token in an SVG `fill` draws black.
 *
 * `data-testid="flow-output"` is on this wrapper only, so the page never has
 * two elements with that testid.
 */
export default function FlowBlock({blocks, source, onNavigate}: FlowBlockProps) {
    const lines = source.split('\n');
    const layout = layoutOf(blocks);
    const unreachableBlocks = findUnreachable(blocks);
    
    const unreachableIds = new Set(unreachableBlocks.map(({id}) => id));
    const duplicate = new Set<string>();
    const seen = new Map<string, number>();
    
    for (const block of blocks) {
        for (const stmt of block.stmts) {
            const count = (seen.get(stmt) || 0) + 1;
            seen.set(stmt, count);
            
            if (count > 1)
                duplicate.add(stmt);
        }
    }
    
    return (
        <div
            className="flow-output"
            data-testid="flow-output"
        >
            <div className="flow-output__side">
                <h4 className="flow-output__title">Source</h4>
                <div
                    className="flow-output__source"
                    data-testid="flow-output__source"
                >
                    {lines.map((text, index) => {
                        const lineNumber = index + 1;
                        
                        // `stmts` are trimmed by the parser, a source line is not
                        const stmtBlock = blocks.find(({stmts}) => stmts.includes(text.trim()));
                        const unreachable = stmtBlock && unreachableIds.has(stmtBlock.id);
                        const dup = duplicate.has(text.trim());
                        
                        return (
                            <div
                                className="flow-output__line"
                                key={lineNumber}
                                onClick={() => onNavigate && onNavigate(lineNumber)}
                                data-unreachable={unreachable || undefined}
                                data-duplicate={dup || undefined}
                            >
                                <span className="flow-output__gutter">
                                    {lineNumber}
                                </span>
                                <code
                                    className="flow-output__text"
                                    dangerouslySetInnerHTML={{
                                        __html: highlight(text),
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="flow-output__side">
                <h4 className="flow-output__title">Graph</h4>
                <svg
                    className="flow-output__graph"
                    data-testid="flow-output__graph"
                    width={layout.width}
                    viewBox={`0 0 ${layout.width} ${layout.height}`}
                >
                    <defs>
                        <marker
                            id="flow-arrow"
                            className="flow-output__arrow"
                            markerWidth={6}
                            markerHeight={6}
                            refX={5}
                            refY={3}
                            orient="auto"
                        >
                            <polygon points="0,0 6,3 0,6"/>
                        </marker>
                    </defs>
                    {layout.edges.map((edge) => (
                        <g key={`${edge.from}-${String(edge.to)}-${edge.label}`}>
                            <path
                                className="flow-output__edge"
                                d={edge.path}
                                markerEnd="url(#flow-arrow)"
                            />
                            {edge.label && (
                                <text
                                    className="flow-output__edge-label"
                                    x={edge.labelX}
                                    y={edge.labelY}
                                >
                                    {edge.label}
                                </text>
                            )}
                        </g>
                    ))}
                    {layout.nodes.map((node) => (
                        <g
                            key={String(node.id)}
                            data-testid="flow-node"
                            data-terminal={node.terminal || undefined}
                            data-unreachable={node.unreachable || undefined}
                        >
                            <rect
                                className="flow-output__node"
                                x={node.x}
                                y={node.y}
                                width={NODE_WIDTH}
                                height={NODE_HEIGHT}
                                rx={4}
                            />
                            <text
                                className="flow-output__label"
                                x={node.x + 10}
                                y={node.y + NODE_HEIGHT / 2 + 4}
                            >
                                {node.label}
                            </text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
