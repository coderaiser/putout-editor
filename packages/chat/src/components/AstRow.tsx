import type {FlatNode} from '@putout/editor-commands';
import {categoryOf} from './typeColor.ts';

export interface AstRowProps {
    node: FlatNode;
    
    /**
     * One boolean per ancestor level, root first, saying whether **that**
     * ancestor was the last child of its own parent.
     *
     * `false` means something continues below it and the level draws `│  `;
     * `true` means nothing does and it draws blanks. `AstRow` cannot work this
     * out itself — it is handed one node, and the answer is about every node
     * above it — so it is computed here over the whole `nodes` list and passed
     * down.
     *
     * Over **all** nodes, not the drawn ones, for the reason `isLast` gives: a
     * folded subtree's last child is not on screen, so asking only the visible
     * rows would call the second-to-last visible child "last" and blank out a
     * pipe that is still there.
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
    
    /**
     * The row's *own* text is the query — shown, and marked.
     *
     * The other half of `dimmed`, and the half that was missing: the filter
     * computed this set from the first version and the component never read it,
     * so a match and the ancestors on the way to it looked alike.
     */
    matched: boolean;
    selected: boolean;
    onSelect: (id: string) => void;
    
    /** Clicking a node with children also folds it — the tree's only pointer affordance. */
    onToggle: (id: string) => void;
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

/**
 * The `│  ` / `   ` prefix for a row's ancestor levels, then its own `├─ ` or
 * `└─ `.
 *
 * A row at depth `d` carries `d - 1` prefix slots, and **slot `k` describes the
 * ancestor at depth `k + 1`** — not the root. That is the part plan.md's
 * `slice(0, depth - 1)` got wrong, and it is worth spelling out because the
 * off-by-one is invisible in the case everybody tries first.
 *
 * The reason is what a pipe *means*. `│` says "there is something below this
 * level", and the thing below a depth-2 row's first slot is its **parent**, not
 * the root:
 *
 * ```text
 * Program                                d0
 * ├── VariableDeclaration   not last     d1   ├─
 * │   ├── VariableDeclarator not last    d2   │  ├─   <- pipe: parent continues
 * │   └── NumericLiteral     last        d2   │  └─   <- pipe: parent continues
 * └── ExpressionStatement    last        d1      └─
 *     └── CallExpression     last        d2         └─  <- blank: parent ended
 * ```
 *
 * So the flags array — root first — has its **root entry dropped** and the
 * parent through to the great-grandparent kept: `slice(1, depth)`. The root never
 * needs a pipe in any case, because a `Program` has no siblings.
 *
 * The old `BLANK.repeat(depth - 1)` could not express this at all, which is why
 * every branch of a tree looked like it ran to the bottom of the file.
 */
/** One ancestor level: a pipe where something continues, blanks where it ended. */
const levelOf = (isLast: boolean): string => isLast ? BLANK : PIPE;

export const connectorsOf = (depth: number, last: boolean, ancestorLastFlags: boolean[]): string => {
    if (!depth)
        return '';
    
    const prefix = ancestorLastFlags
        .slice(1, depth)
        .map(levelOf)
        .join('');
    
    return `${prefix}${last ? ELBOW : TEE}`;
};

export default function AstRow({node, ancestorLastFlags, hasChildren, collapsed, last, dimmed, matched, selected, onSelect, onToggle}: AstRowProps) {
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
            data-testid="ast-row"
            data-type={node.type}
            onClick={() => {
                onSelect(node.id);
                
                if (hasChildren)
                    onToggle(node.id);
            }}
            role="treeitem"
        >
            {/*
             * Connectors first, then caret, then the label - and the order is
             * the drawing rather than a presentation detail. A two-character
             * caret sitting to the left of its own branch marker puts this row's
             * `├` under the *parent's* caret instead of under the parent's `├`,
             * and the vertical line stops reading as continuous, which is the one
             * thing a tree drawing exists to do.
             */}
            <span className="ast-row__connectors">
                {connectorsOf(node.depth, last, ancestorLastFlags)}
            </span>
            <span className="ast-row__caret">
                {caretOf(hasChildren, collapsed)}
            </span>
            {/*
             * The colour, by attribute rather than by `style` or by a class per
             * category: `AstTree.css` owns all eight selectors, so adding a type
             * is a `Set` entry and a rule, with no JSX to keep in step and no
             * inline value that could drift from the stylesheet's token.
             *
             * On this span rather than on the row, so the selector is
             * `.ast-row__type[data-category="x"]` — the attribute and the
             * element it colours on one node, with no ancestor hop. Same
             * specificity as the descendant form it replaces, so the cascade
             * order is unchanged and no rule had to move.
             */}
            <span
                className="ast-row__type"
                data-category={categoryOf(node.type)}
            >
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
