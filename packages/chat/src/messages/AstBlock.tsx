import type {FlatNode} from '@putout/editor-commands';
import {useIsMobile} from '../hooks/useIsMobile.ts';
import AstTree from '../components/AstTree.tsx';

export interface AstBlockProps {
    nodes: FlatNode[];
    source: string;
}

/**
 * The `ast` answer. `AstTree` is here: `@putout/editor-commands` has no
 * React. Do not add a `data-testid`: `AstTree` has `ast-output`.
 * `useIsMobile()` is here: it is a page property, not a tree property.
 */
export default function AstBlock({nodes, source}: AstBlockProps) {
    const mobile = useIsMobile();
    
    return (
        <div className="ast-block">
            <AstTree
                mobile={mobile}
                nodes={nodes}
                source={source}
            />
        </div>
    );
}
