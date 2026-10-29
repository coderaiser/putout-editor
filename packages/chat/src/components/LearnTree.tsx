// The stylesheet is imported from the component rather than from the entry, so
// the tree carries its own colours wherever it is mounted — a chat message, the
// console panel, or a spec.
import './AstTree.css';
import type {FlatLearnNode} from '@putout/editor-commands';
import {useTreeState} from './useTreeState.ts';
import LearnRow from './LearnRow.tsx';
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
    
    /**
     * A coarse pointer, for the status hint and the handler of each row.
     * Same role as in `AstTree`.
     */
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

const ancestorLastFlags = (nodes: FlatLearnNode[], node: FlatLearnNode): boolean[] => chainOf(nodes, node).map(lastFlagOf(nodes));

/**
 * The `/learn` tree: `AstTree` with the same CSS, rows, `useTreeState` and
 * `AstSearch`. No code preview column: a concept has no source. `Enter` on
 * a leaf calls `onOpen`. `collapsedDepth: 0`. Its own status bar:
 * `AstStatus` reads `type`, `line` and `col`, which a concept does not have.
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
                        ancestorLastFlags={ancestorLastFlags(nodes, node)}
                        collapsed={state.collapsed.has(node.id)}
                        dimmed={dimmed.has(node.id)}
                        hasChildren={node.hasChildren}
                        key={node.id}
                        last={isLast(nodes, node)}
                        matched={matched.has(node.id)}
                        node={node}
                        onSelect={state.select}
                        onToggle={state.toggle}
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
