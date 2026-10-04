// The stylesheet is imported from the component rather than from the entry, so
// the tree carries its own colours wherever it is mounted — a chat message, the
// console panel, or a spec.
import './AstTree.css';
import type {FlatNode} from '@putout/editor-commands';
import {useTreeState} from './useTreeState.ts';
import AstRow from './AstRow.tsx';
import AstSearch from './AstSearch.tsx';
import AstCodePreview from './AstCodePreview.tsx';
import AstStatus from './AstStatus.tsx';

export interface AstTreeProps {
    nodes: FlatNode[];
    source: string;
    
    /**
     * Coarse pointer, threaded to `AstStatus` for the hint.
     *
     * Optional and defaulting to `false` so the tree can be mounted anywhere —
     * a spec, the console panel — without the caller having to know about
     * pointers at all. Only the **hint** is decided in JS; the code preview is
     * hidden by `@media (pointer: coarse)` in `AstTree.css`, because a column
     * that is not rendered cannot be un-rendered by CSS and one that is
     * rendered-then-hidden still costs a `minmax(0, 1fr)` to size.
     */
    mobile?: boolean;
}

const siblingOf = (pid: string) => (node: FlatNode) => node.pid === pid;

/**
 * The last row of a parent, computed over **all** nodes rather than the drawn
 * ones. A folded subtree's last child is not on screen, so asking only the
 * visible rows would call the second-to-last visible child "last" as soon as
 * the real last one is folded away.
 *
 * Takes the node rather than an id, because every call is already holding one
 * and a lookup would add a `pid === null` fallback that nothing can reach —
 * `rows` is drawn from `nodes`, so an id is always in it.
 */
const isLast = (nodes: FlatNode[], node: FlatNode) => {
    const {pid} = node;
    
    if (pid === null)
        return true;
    
    const siblings = nodes.filter(siblingOf(pid));
    
    // `siblings` is never empty: `pid` came from this node, and `nodes` is the
    // list this node was drawn from, so the parent is in it. That is why there
    // is no guard here — a `|| ''` branch would be unreachable, and unreachable
    // is what the 100% gate is there to catch.
    const last = siblings.at(-1) as FlatNode;
    
    return last.id === node.id;
};

/**
 * Whether each ancestor of `node` was the last child of *its* parent, root
 * first.
 *
 * The answer `AstRow` needs and cannot get itself: it is handed one node, and
 * what decides whether a level draws `│  ` or three blanks is whether something
 * continues below that level — which is a fact about every node above this one.
 * So it is computed here over the whole list and passed down as one boolean per
 * level.
 *
 * `isLast`-by-id rather than by position, so it does not depend on the order
 * `flattenAst` happened to emit siblings in.
 */
/** `isLast` with its list bound, so the map below is a bare function call. */
const lastOf = (nodes: FlatNode[]) => (ancestor: FlatNode): boolean => isLast(nodes, ancestor);

const chainOf = (nodes: FlatNode[], node: FlatNode): FlatNode[] => {
    const parent = node.pid === null ? null : nodes.find(({id}) => id === node.pid);
    
    // Reachable, and covered: `nodes` is a prop, and `FlatNode.pid` is
    // `string | null`, so a caller can hand over a node whose parent is not in
    // the list. `visibleRows` survives that (`parents.get(parent) || null` ends
    // its walk) and so must this. An earlier version of this comment claimed the
    // case could not arise because `flattenAst` resolves every `pid` — true of
    // `flattenAst`, and not a property of the prop.
    if (!parent)
        return [];
    
    return [
        ...chainOf(nodes, parent),
        parent,
    ];
};

const ancestorLastFlags = (nodes: FlatNode[], node: FlatNode): boolean[] => chainOf(nodes, node)
    .map(lastOf(nodes));

export default function AstTree({nodes, source, mobile}: AstTreeProps) {
    const state = useTreeState(nodes);
    const {
        rows,
        dimmed,
        matched,
    } = state.visible;
    
    const parents = new Set(nodes
        .map(({pid}) => pid)
        .filter(Boolean));
    
    const selected = nodes.find(({id}) => id === state.selected) || null;
    
    return (
        <div
            className="ast"
            data-testid="ast-output"
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
            <div className="ast__body">
                <div
                    className="ast__tree"
                    role="tree"
                >
                    {rows.length === 0 && (
                        <div className="ast__empty">
                            {'No AST. Run ast first.'}
                        </div>
                    )}
                    {rows.map((node) => (
                        <AstRow
                            ancestorLastFlags={ancestorLastFlags(nodes, node)}
                            collapsed={state.collapsed.has(node.id)}
                            dimmed={dimmed.has(node.id)}
                            hasChildren={parents.has(node.id)}
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
                <AstCodePreview
                    selected={selected}
                    source={source}
                />
            </div>
            <AstStatus
                hidden={nodes.length - rows.length}
                mobile={mobile}
                selected={selected}
            />
        </div>
    );
}
