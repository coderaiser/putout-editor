import '../css/highlight.css';
import './FlowBlock.css';
import {
    findUnreachable,
    type Block,
} from '@putout/flow';
import {highlight} from '../highlight.ts';
import {useIsMobile} from '../hooks/useIsMobile.ts';

export interface FlowBlockProps {
    blocks: Block[];
    source: string;
    onNavigate?(line: number): void;
}

/**
 * The `/flow` answer: source with line numbers beside its control-flow graph.
 *
 * Left panel — source, line-numbered like `SourceBlock`, with `unreachable`
 * and `duplicate` CSS classes on the lines a block carries. `unreachable`
 * means no path reaches that block; `duplicate` means two blocks share the
 * same statement text. Clicking a line whose block has one calls `onNavigate`
 * with its line number, so the editor can scroll the user to it.
 *
 * Right panel — an inline SVG graph: blocks as `<rect>`, edges as `<line>`
 * with a `<marker>` arrowhead, no library. Unreachable blocks draw dimmed.
 *
 * Layout copies `TransformDiff`'s `transform-diff__side` two-column grid, and
 * `useIsMobile()` is read exactly as `AstBlock` reads it — a property of the
 * page. `data-testid="flow-output"` lives on this wrapper only: a child that
 * drew its own `flow-output` would give the page two elements with the same
 * testid, which is the AstBlock lesson.
 */
export default function FlowBlock({blocks, source, onNavigate}: FlowBlockProps) {
    const mobile = useIsMobile();
    const lines = source.split('\n');
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
                    width={mobile ? 300 : 480}
                    height={mobile ? 200 : 300}
                >
                    {blocks.map((block) => (
                        <g key={block.id}>
                            <rect
                                className="flow-output__node"
                                x={block.id * 120}
                                y={mobile ? 40 : 80}
                                width={80}
                                height={24}
                                fill={unreachableIds.has(block.id) ? 'var(--color-text-muted)' : 'var(--color-bg)'}
                                stroke={block.terminal ? 'var(--color-accent)' : 'var(--color-border)'}
                            />
                            <text
                                x={block.id * 120 + 10}
                                y={mobile ? 57 : 97}
                                fontSize={10}
                                fill="var(--color-text)"
                            >
                                block {block.id}
                            </text>
                            {block.succs.map((succ) => (
                                <line
                                    key={String(succ.id)}
                                    x1={block.id * 120 + 80}
                                    y1={mobile ? 52 : 92}
                                    x2={String(succ.id) === 'exit' ? block.id * 120 + 120 : (succ.id as number) * 120}
                                    y2={mobile ? 52 : 92}
                                    stroke="var(--color-border)"
                                    markerEnd="url(#flow-arrow)"
                                />
                            ))}
                        </g>
                    ))}
                    <defs>
                        <marker
                            id="flow-arrow"
                            markerWidth={6}
                            markerHeight={6}
                            refX={4}
                            refY={3}
                            orient="auto"
                        >
                            <polygon points="0,0 6,3 0,6" fill="var(--color-text-muted)"/>
                        </marker>
                    </defs>
                </svg>
            </div>
        </div>
    );
}
