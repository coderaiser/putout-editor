import type {FlatNode} from '@putout/editor-commands';
import {categoryOf} from './typeColor.ts';
import TreeRow, {type RowProps} from './TreeRow.tsx';

export interface AstRowProps extends RowProps {
    node: FlatNode;
    
    /**
     * Whether this row is on a mobile device.
     */
    mobile?: boolean;
}

export default function AstRow({node, ...row}: AstRowProps) {
    return (
        <TreeRow
            {...row}
            depth={node.depth}
            id={node.id}
            testId="ast-row"
            type={node.type}
        >
            {node.key && (
                <span className="ast-row__key">
                    {`${node.key}:`}
                </span>
            )}
            {/*
             * The colour, by attribute rather than by `style` or by a class per
             * category: `AstTree.css` owns all eight selectors, so adding a type
             * is a `Set` entry and a rule, with no JSX to keep in step and no
             * inline value that could drift from the stylesheet's token.
             *
             * On this span rather than on the row, so the selector is
             * `.ast-row__type[data-category="x"]` — the attribute and the
             * element it colours on one node, with no ancestor hop.
             */}
            <span
                className="ast-row__type"
                data-category={categoryOf(node.type)}
            >
                {node.type}
            </span>
            {node.detail && (
                <span className="ast-row__detail">
                    {node.detail}
                </span>
            )}
            <span className="ast-row__pos">
                {`${node.line}:${node.col}`}
            </span>
        </TreeRow>
    );
}
