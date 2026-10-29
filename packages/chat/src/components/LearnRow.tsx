import type {FlatLearnNode} from '@putout/editor-commands';
import {caretOf, connectorsOf} from './AstRow.tsx';

export interface LearnRowProps {
    node: FlatLearnNode;
    
    /**
     * One boolean per ancestor, root first: was that ancestor the last child?
     * `false` draws `│  `, `true` draws blanks. Same as `AstRow`.
     */
    ancestorLastFlags: boolean[];
    
    /** Whether any row names this one as its parent. */
    hasChildren: boolean;
    
    /** True when the node's children are hidden. */
    collapsed: boolean;
    
    /** Whether this row is the last of its parent's children. */
    last: boolean;
    
    /** The row is on the path to a match — shown, but dimmed. */
    dimmed: boolean;
    
    /** The row's *own* text is the query — shown, and marked. */
    matched: boolean;
    selected: boolean;
    onSelect: (id: string) => void;
    
    /**
     * A click on a node with children also folds it, on each device. The whole
     * row is the target: the caret is too small for a finger.
     */
    onToggle: (id: string) => void;
}

/**
 * One row of the learn tree, with the handlers of `AstRow`. It shows a label
 * and a summary, and no `line:col`: a concept has no position.
 */
export default function LearnRow({node, ancestorLastFlags, hasChildren, collapsed, last, dimmed, matched, selected, onSelect, onToggle}: LearnRowProps) {
    return (
        <div
            className={[
                'ast-row',
                selected && 'ast-row--selected',
                dimmed && 'ast-row--dimmed',
                matched && 'ast-row--match',
            ]
                .filter(Boolean)
                .join(' ')}
            data-testid="learn-row"
            onClick={() => {
                onSelect(node.id);
                
                if (hasChildren)
                    onToggle(node.id);
            }}
            role="treeitem"
        >
            <span className="ast-row__connectors">
                {connectorsOf(node.depth, last, ancestorLastFlags)}
            </span>
            <span
                className="ast-row__caret"
            >
                {caretOf(hasChildren, collapsed)}
            </span>
            <span className="ast-row__type">
                {node.label}
            </span>
            {node.summary && (
                <span className="ast-row__detail">
                    {node.summary}
                </span>
            )}
        </div>
    );
}
