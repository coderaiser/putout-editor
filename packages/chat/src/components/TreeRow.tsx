import type {ReactNode} from 'react';
import type {Layout} from './treeModel.ts';

/**
 * What every tree row takes, whatever it shows. `Layout` has the branch
 * lines: `last`, `hasChildren` and `ancestorLastFlags`. Find it with
 * `layoutOf` over all nodes, not over the drawn ones: a folded subtree
 * hides its last child.
 */
export interface RowProps extends Layout {
    /** True when the node's children are hidden. */
    collapsed: boolean;
    
    /** The row is on the path to a match — shown, but dimmed. */
    dimmed: boolean;
    
    /** The row's *own* text is the query — shown, and marked. */
    matched: boolean;
    selected: boolean;
    onSelect: (id: string) => void;
    
    /**
     * Clicking a node with children also folds it — the tree's only pointer
     * affordance, on any device.
     *
     * The whole row toggles, not just the caret: on a phone the caret is
     * ~14px and too small to tap reliably, so the tap target is the entire
     * row. The caret span keeps its glyph only; its own handler is gone.
     */
    onToggle: (id: string) => void;
}

export interface TreeRowProps extends RowProps {
    id: string;
    depth: number;
    testId: string;
    
    /** Goes to `data-type`. A tree without types leaves it out. */
    type?: string;
    children: ReactNode;
}

const OPEN = '▾';
const CLOSED = '▸';
const TEE = '├─ ';
const ELBOW = '└─ ';
const PIPE = '│  ';
const BLANK = '   ';

/** A leaf gets no caret at all, which is two spaces rather than nothing. */
export const caretOf = (hasChildren: boolean, collapsed: boolean) => {
    if (!hasChildren)
        return '  ';
    
    return collapsed ? CLOSED : OPEN;
};

/** One ancestor level: a pipe where something continues, blanks where it ended. */
const levelOf = (isLast: boolean): string => isLast ? BLANK : PIPE;

/**
 * The ancestor prefix of a row, then its `├─ ` or `└─ `. A row at depth `d`
 * has `d - 1` slots. Slot `k` is the ancestor at depth `k + 1`, not the
 * root: use `slice(1, depth)` of the root-first flags. A pipe means that
 * ancestor has a later sibling.
 */
export const connectorsOf = (depth: number, last: boolean, ancestorLastFlags: boolean[]): string => {
    if (!depth)
        return '';
    
    const prefix = ancestorLastFlags
        .slice(1, depth)
        .map(levelOf)
        .join('');
    
    return `${prefix}${last ? ELBOW : TEE}`;
};

/**
 * The shell of a row: the classes, the click and the branch drawing. The
 * children are what the row shows, and they come after the caret.
 *
 * The order is the drawing. A two-character caret to the left of its own
 * branch marker puts this row's `├` under the *parent's* caret instead of
 * under the parent's `├`, and the vertical line stops reading as continuous.
 */
export default function TreeRow({id, depth, testId, type, children, ancestorLastFlags, hasChildren, collapsed, last, dimmed, matched, selected, onSelect, onToggle}: TreeRowProps) {
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
            data-testid={testId}
            data-type={type}
            onClick={() => {
                onSelect(id);
                
                if (hasChildren)
                    onToggle(id);
            }}
            role="treeitem"
        >
            <span className="ast-row__connectors">
                {connectorsOf(depth, last, ancestorLastFlags)}
            </span>
            <span className="ast-row__caret">
                {caretOf(hasChildren, collapsed)}
            </span>
            {children}
        </div>
    );
}
