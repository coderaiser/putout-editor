import type {FlatNode} from '@putout/editor-commands';
import {categoryOf} from './typeColor.ts';

export interface AstRowProps {
    node: FlatNode;
    
    /**
     * One boolean per ancestor, root first: was that ancestor the last child?
     * `false` draws `│  `, `true` draws blanks. Computed over all nodes, not
     * only drawn ones: a folded subtree hides its last child.
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
     * Whether this row is on a mobile device.
     */
    mobile?: boolean;
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
 * The ancestor prefix of a row, then its `├─ ` or `└─ `. A row at depth `d`
 * has `d - 1` slots. Slot `k` is the ancestor at depth `k + 1`, not the
 * root: use `slice(1, depth)` of the root-first flags. A pipe means that
 * ancestor has a later sibling.
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
            {node.key && (
                <span className="ast-row__key">
                    {`${node.key}:`}
                </span>
            )}
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
