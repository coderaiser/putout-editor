import {useTreeState} from './useTreeState.ts';
import AstRow from './AstRow.tsx';
import AstSearch from './AstSearch.tsx';
import AstCodePreview from './AstCodePreview.tsx';
import AstStatus from './AstStatus.tsx';
import type {FlatNode} from '../state.types.ts';

export interface AstTreeProps {
    nodes: FlatNode[];
    source: string;
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

export default function AstTree({nodes, source}: AstTreeProps) {
    const state = useTreeState(nodes);
    const {rows, dimmed} = state.visible;
    
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
                            {'No AST. Run /ast first.'}
                        </div>
                    )}
                    {rows.map((node) => (
                        <AstRow
                            collapsed={state.collapsed.has(node.id)}
                            dimmed={dimmed.has(node.id)}
                            hasChildren={parents.has(node.id)}
                            key={node.id}
                            last={isLast(nodes, node)}
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
                selected={selected}
            />
        </div>
    );
}
