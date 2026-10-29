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
     * A coarse pointer, for the hint of `AstStatus` and the tap of `AstRow`.
     * Default `false`. CSS (`@media (pointer: coarse)`) hides the code preview.
     */
    mobile?: boolean;
}

const siblingOf = (pid: string) => (node: FlatNode) => node.pid === pid;

/**
 * What a query matches on an AST row: its key, its type and its detail.
 *
 * Passed in rather than read inside the hook, because the hook is shared with
 * `LearnTree` — which matches on a label and a summary and has no `type` at all.
 * A hard-coded `${type} ${detail}` here would either be dead for one of them or
 * would need a branch on which tree is asking.
 */
const textOfAst = (node: FlatNode) => `${node.key} ${node.type} ${node.detail}`;

/**
 * Is the node the last child of its parent? Ask over all nodes, not the
 * drawn ones: a folded subtree hides its last child.
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
 * For each ancestor of `node`, root first: was it the last child of its
 * parent? `AstRow` gets one node only, so the tree computes this.
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

const ancestorLastFlags = (nodes: FlatNode[], node: FlatNode): boolean[] => chainOf(nodes, node).map(lastOf(nodes));

export default function AstTree({nodes, source, mobile}: AstTreeProps) {
    const state = useTreeState(nodes, {
        textOf: textOfAst,
    });
    
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
