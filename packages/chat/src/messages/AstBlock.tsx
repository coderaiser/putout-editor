import {AstTree, type FlatNode} from '@putout/editor-commands';

export interface AstBlockProps {
    nodes: FlatNode[];
    source: string;
}

/**
 * The `/ast` reply, and the whole reason this package is a chat rather than a
 * form: the tree is `@putout/editor-commands`' own `AstTree`, not the client's
 * `Tree.tsx`. It is self-contained — props in, events out — so the import is
 * a package boundary and not an alias into the editor's store.
 */
export default function AstBlock({nodes, source}: AstBlockProps) {
    return (
        <div
            className="ast-block"
            data-testid="ast-output"
        >
            <AstTree
                nodes={nodes}
                source={source}
            />
        </div>
    );
}
