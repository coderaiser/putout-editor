// The stylesheet is imported from the component rather than from the entry, so
// the tree carries its own colours wherever it is mounted — a chat message, the
// console panel, or a spec.
import './AstTree.css';
import type {ReactNode} from 'react';
import type {FlatLearnNode} from '@putout/editor-commands';
import {Fragment} from 'react';
import {useTreeState} from './useTreeState.ts';
import {caretOf, connectorsOf} from './AstRow.tsx';
import AstSearch from './AstSearch.tsx';

export interface LearnTreeProps {
    nodes: FlatLearnNode[];
    
    /**
     * Enter/space on a leaf.
     *
     * A prop rather than a dispatch, because the tree knows nothing about the
     * thread or Redux — the same reason `AstTree` is self-contained. The parent
     * decides what opening a concept means; here it appends the body and, if
     * there is one, a `[try it →]`.
     */
    onOpen: (node: FlatLearnNode) => void;
    
    /** Coarse pointer, threaded to the status bar's hint. Same role as `AstTree`'s. */
    mobile?: boolean;
}

/**
 * What a query matches on a learn row: its label and its summary.
 *
 * The summary is half of it on purpose. Searching `VariableDeclaration` should
 * find the node whose *label* is that, and searching `zero or more arguments`
 * should find `__args` — which is only reachable if the one-line description is
 * searched too.
 */
const textOfLearn = (node: FlatLearnNode) => `${node.label} ${node.summary}`;

const HINT_FULL = '↑↓/jk navigate · space/enter open · / search · tab switch';
const HINT_SHORT = '↑↓ · enter · /';

const siblingOf = (pid: string) => (node: FlatLearnNode) => node.pid === pid;

/**
 * The last row of a parent, over **all** rows.

 * A folded subtree's last child is not on screen, so asking only the drawn rows
 * would call the second-to-last visible child "last" the moment the real last
 * one folded away — and the `└─` would move. Same rule `AstTree` states, and
 * worth restating rather than trusting a reader to go and look.
 */
const isLast = (nodes: FlatLearnNode[], node: FlatLearnNode) => {
    const {pid} = node;
    
    if (pid === null)
        return true;
    
    const siblings = nodes.filter(siblingOf(pid));
    const last = siblings.at(-1) as FlatLearnNode;
    
    return last.id === node.id;
};

/** Every ancestor of `node`, root first — one boolean per level for the pipes. */
const chainOf = (nodes: FlatLearnNode[], node: FlatLearnNode): FlatLearnNode[] => {
    const parent = node.pid === null ? null : nodes.find(({id}) => id === node.pid);
    
    if (!parent)
        return [];
    
    return [
        ...chainOf(nodes, parent),
        parent,
    ];
};

const lastFlagOf = (nodes: FlatLearnNode[]) => (ancestor: FlatLearnNode) => isLast(nodes, ancestor);

const ancestorLastFlags = (nodes: FlatLearnNode[], node: FlatLearnNode): boolean[] => chainOf(nodes, node)
    .map(lastFlagOf(nodes));

/**
 * One row in the learn tree.
 *
 * Extracted from `LearnTree`'s `.map()` callback so `hoist-arrow-callback`
 * does not flag it — the same reason `AstRow` is its own component rather
 * than an inline block in `AstTree`.
 */
interface LearnRowProps {
    node: FlatLearnNode;
    nodes: FlatLearnNode[];
    selected: boolean;
    dimmed: boolean;
    matched: boolean;
    collapsed: boolean;
    onSelect: (id: string) => void;
}

const LearnRow = ({node, nodes, selected, dimmed, matched, collapsed, onSelect}: LearnRowProps): ReactNode => (
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
        key={node.id}
        onClick={() => onSelect(node.id)}
        role="treeitem"
    >
        <span className="ast-row__connectors">
            {connectorsOf(node.depth, isLast(nodes, node), ancestorLastFlags(nodes, node))}
        </span>
        <span className="ast-row__caret">
            {caretOf(node.hasChildren, collapsed)}
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

/**
 * The `/learn` tree.
 *
 * Structurally `AstTree`, and deliberately so: same stylesheet, same rows, same
 * `useTreeState` keyboard logic, same `AstSearch` bar. What differs is the data
 * and two consequences of it.
 *
 * - **No code preview column.** `AstTree` shows the source beside the tree so a
 *   selected node's text is visible. A concept has no source, so that column
 *   would be permanently blank — and `grid-template-columns: 1fr 1fr` would give
 *   half the thread to it.
 * - **Enter opens.** On a leaf, `Enter` calls `onOpen` instead of toggling. On a
 *   container it still toggles, which is what a caret means.
 *
 * `collapsedDepth: 0` rather than the AST tree's `1`: the root is open and its
 * sections are not, because a concept tree's first level *is* the table of
 * contents. See `TreeOptions.collapsedDepth`.
 *
 * The status bar is written here rather than reusing `AstStatus`, whose
 * `selected` prop is a `FlatNode` — it reads `type`, `line` and `col`, none of
 * which a concept has. Generalising it to a union would put a branch in a
 * component whose whole job is to print three fields.
 */
export default function LearnTree({nodes, onOpen, mobile}: LearnTreeProps) {
    const state = useTreeState(nodes, {
        collapsedDepth: 0,
        onOpen,
        textOf: textOfLearn,
    });
    
    const {
        rows,
        dimmed,
        matched,
    } = state.visible;
    
    const selected = nodes.find(({id}) => id === state.selected) || null;
    const hidden = nodes.length - rows.length;
    
    return (
        <div
            className="ast"
            data-testid="learn-output"
            ref={state.root}
            tabIndex={0}
        >
            <AstSearch
                focused={state.focus === 'search'}
                onFocusChange={(focused) => state.setFocus(focused ? 'search' : 'tree')}
                onQueryChange={state.setQuery}
                query={state.query}
                shown={rows.length}
            />
            <div className="ast__tree">
                {rows.map((node) => (
                    <LearnRow
                        collapsed={state.collapsed.has(node.id)}
                        dimmed={dimmed.has(node.id)}
                        key={node.id}
                        matched={matched.has(node.id)}
                        node={node}
                        nodes={nodes}
                        onSelect={state.select}
                        selected={state.selected === node.id}
                    />
                ))}
            </div>
            <div
                className="ast-status"
                data-testid="learn-status"
            >
                <span className="ast-status__type">
                    {selected ? selected.label : '—'}
                </span>
                {hidden > 0 && (
                    <span className="ast-status__hidden">
                        {`${hidden} hidden`}
                    </span>
                )}
                <span className="ast-status__help">
                    {mobile ? HINT_SHORT : HINT_FULL}
                </span>
            </div>
        </div>
    );
}
