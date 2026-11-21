// The stylesheet is imported from the component rather than from the entry, so
// the tree carries its own colours wherever it is mounted — a chat message, the
// console panel, or a spec.
import './AstTree.css';
import type {FlatNode} from '@putout/editor-commands';
import {useTreeState} from './useTreeState.ts';
import {layoutOf, type Layout} from './treeModel.ts';
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

/**
 * What a query matches on an AST row: its key, its type and its detail.
 *
 * Passed in rather than read inside the hook, because the hook is shared with
 * `LearnTree` — which matches on a label and a summary and has no `type` at all.
 * A hard-coded `${type} ${detail}` here would either be dead for one of them or
 * would need a branch on which tree is asking.
 */
const textOfAst = (node: FlatNode) => `${node.key} ${node.type} ${node.detail}`;

export default function AstTree({nodes, source, mobile}: AstTreeProps) {
    const state = useTreeState(nodes, {
        textOf: textOfAst,
    });
    
    // `ref={root}` would make the compiler treat all of `state` as a ref.
    const {root} = state;
    
    const {
        rows,
        dimmed,
        matched,
    } = state.visible;
    
    const layout = layoutOf(nodes);
    
    const selected = nodes.find(({id}) => id === state.selected) || null;
    
    return (
        <div
            className="ast"
            data-testid="ast-output"
            ref={root}
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
                            {...(layout.get(node.id) as Layout)}
                            collapsed={state.collapsed.has(node.id)}
                            dimmed={dimmed.has(node.id)}
                            key={node.id}
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
