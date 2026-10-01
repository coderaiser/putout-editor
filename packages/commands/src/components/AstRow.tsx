import type {FlatNode} from '../state.types.ts';

export interface AstRowProps {
    node: FlatNode;
    
    /** Whether any row names this one as its parent. */
    hasChildren: boolean;
    
    /** True when the node's children are hidden. */
    collapsed: boolean;
    
    /** Whether this row is the last of its parent's children. */
    last: boolean;
    
    /** The row is on the path to a match — shown, but dimmed. */
    dimmed: boolean;
    selected: boolean;
    onSelect: (id: string) => void;
    
    /** Clicking a node with children also folds it — the tree's only pointer affordance. */
    onToggle: (id: string) => void;
}

const OPEN = '▾';
const CLOSED = '▸';
const TEE = '├─';
const ELBOW = '└─';
const BLANK = '   ';

/** A leaf gets no caret at all, which is two spaces rather than nothing. */
export const caretOf = (hasChildren: boolean, collapsed: boolean) => {
    if (!hasChildren)
        return '  ';
    
    return collapsed ? CLOSED : OPEN;
};

/**
 * The `│  ` prefix a deeper row carries, one three-space group per ancestor
 * level, then `├─ ` or `└─ ` for this row. A row at depth 0 has no connectors —
 * the tree's root is not a child of anything.
 */
export const connectorsOf = (depth: number, last: boolean) => {
    if (!depth)
        return '';
    
    return `${BLANK.repeat(depth - 1)}${last ? ELBOW : TEE} `;
};

export default function AstRow({node, hasChildren, collapsed, last, dimmed, selected, onSelect, onToggle}: AstRowProps) {
    return (
        <div
            className={[
                'ast-row',
                selected && 'ast-row--selected',
                dimmed && 'ast-row--dimmed',
            ]
                .filter(Boolean)
                .join(' ')}
            data-testid="ast-row"
            data-type={node.type}
            onClick={() => {
                onSelect(node.id);
                
                if (hasChildren)
                    onToggle(node.id);
            }}
            role="treeitem"
            style={{
                paddingLeft: `${node.depth * 12}px`,
            }}
        >
            <span className="ast-row__caret">
                {caretOf(hasChildren, collapsed)}
            </span>
            <span className="ast-row__connectors">
                {connectorsOf(node.depth, last)}
            </span>
            <span className="ast-row__type">
                {node.type}
            </span>
            {node.detail && (
                <span className="ast-row__detail">
                    {node.detail}
                </span>
            )}
            <span className="ast-row__pos">
                {`${node.line}:${node.col}`}
            </span>
        </div>
    );
}
