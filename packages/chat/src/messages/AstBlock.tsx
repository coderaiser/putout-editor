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
