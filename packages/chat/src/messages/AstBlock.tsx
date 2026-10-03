import type {FlatNode} from '@putout/editor-commands';
import AstTree from '../components/AstTree.tsx';

export interface AstBlockProps {
    nodes: FlatNode[];
    source: string;
}

/**
 * The `/ast` reply. `AstTree` lives here rather than in
 * `@putout/editor-commands`: that package is a Node library with no React and
 * no DOM, and the tree is a view. It is self-contained — props in, events out —
 * so nothing here reaches for the store.
 *
 * The `data-testid` lives here and **not** on a wrapper of `AstTree`: `AstTree`
 * already carries `ast-output` itself, and putting a second one on this wrapper
 * gives a page two elements with the same testid — which is what the e2e caught,
 * as a strict-mode violation rather than as anything subtle. A testid is an
 * identity, and a component that has one does not get another from its parent.
 */
export default function AstBlock({nodes, source}: AstBlockProps) {
    return (
        <div className="ast-block">
            <AstTree
                nodes={nodes}
                source={source}
            />
        </div>
    );
}
