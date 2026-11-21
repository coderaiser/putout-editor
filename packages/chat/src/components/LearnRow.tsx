import type {FlatLearnNode} from '@putout/editor-commands';
import TreeRow, {type RowProps} from './TreeRow.tsx';

export interface LearnRowProps extends RowProps {
    node: FlatLearnNode;
}

/**
 * One row of the learn tree, with the handlers of `AstRow`. It shows a label
 * and a summary, and no `line:col`: a concept has no position.
 */
export default function LearnRow({node, ...row}: LearnRowProps) {
    return (
        <TreeRow
            {...row}
            depth={node.depth}
            id={node.id}
            testId="learn-row"
        >
            <span className="ast-row__type">
                {node.label}
            </span>
            {node.summary && (
                <span className="ast-row__detail">
                    {node.summary}
                </span>
            )}
        </TreeRow>
    );
}
