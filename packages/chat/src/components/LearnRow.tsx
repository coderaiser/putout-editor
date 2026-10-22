import type {FlatLearnNode} from '@putout/editor-commands';
import {caretOf, connectorsOf} from './AstRow.tsx';

export interface LearnRowProps {
    node: FlatLearnNode;
    
    /**
     * One boolean per ancestor level, root first, saying whether **that**
     * ancestor was the last child of its own parent.
     *
     * `false` means something continues below it and the level draws `│  `;
     * `true` means nothing does and it draws blanks. A row cannot work this out
     * itself — it is handed one node, and the answer is about every node above
     * it — so it is computed over the whole list and passed down, exactly as
     * `AstRow` takes it.
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
     * Clicking a node with children also folds it — on a **fine** pointer only.
     *
     * A coarse pointer fires `click` on `pointerup`, so binding both effects to
     * one handler folds on the first tap and unfolds on the second: the user
     * taps a row twice and watches nothing happen. This is the whole of bug 2,
     * and the reason `LearnRow` exists as a component rather than as the inline
     * `<div onClick>` `LearnTree` carried — that row called `onSelect` and had
     * no `onToggle` at all, so a learn tree could not be folded by pointer on
     * **any** device.
     *
     * Copied from `AstRow` rather than reinvented: two trees that draw the same
     * rows with the same caret should answer a pointer the same way, and the
     * coarse-pointer reasoning was worked out once, there.
     */
    onToggle: (id: string) => void;
}

/**
 * One row in the learn tree.
 *
 * Extracted from `LearnTree`'s `.map()` callback for `hoist-arrow-callback`, and
 * then given `AstRow`'s handler shape — which is what makes the two trees behave
 * alike. A concept row shows a label and a summary where an AST row shows a type
 * and a detail, and carries no `line:col` because a concept has no position in a
 * file; the row itself is otherwise the same drawing.
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
                onClick={hasChildren
                    ? (e) => {
                        e.stopPropagation();
                        onToggle(node.id);
                    }
                    : undefined}
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
