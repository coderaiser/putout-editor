import {useState, useMemo} from 'react';
import {useSelector} from 'react-redux';
import {codeframe} from 'putout';
import {getParser} from '#parser';
import {
    getParseResult,
    getCursor,
    getCode,
} from '#store';
import {getFocusPath, Editor} from '#editor';
import {type AstNode} from '../types.ts';
import visualizations, {
    type VisualizationProps,
} from './visualization.tsx';
import {Button} from './Button.tsx';

const getName = (a: {
    displayName?: string;
    name?: string;
}) => a.displayName || a.name || '';

function formatTime(time: number | null | undefined) {
    if (!time)
        return null;
    
    if (time < 1000)
        return `${time}ms`;
    
    return `${(time / 1000).toFixed(2)}s`;
}

const clearName = (a: string) => a
    .split('_')
    .pop() || '';

export default function EditorASTTree() {
    const parser = useSelector(getParser);
    const parseResult = useSelector(getParseResult);
    const cursor = useSelector(getCursor);
    const code = useSelector(getCode);
    const [selectedOutput, setSelectedOutput] = useState(0);
    const ast: AstNode | null = (parseResult?.ast as AstNode) || null;
    const Visualization = visualizations[selectedOutput] as React.ComponentType<VisualizationProps>;
    
    if (!parser)
        throw Error('Parser not found');
    
    const focusPath = useMemo(() => ast && cursor != null ? getFocusPath(ast, cursor, parser) : [], [ast, cursor, parser]);
    
    let output: React.ReactNode;
    
    if (parseResult?.error)
        output = (
            <div className="container">
                <Editor
                    key="error"
                    readOnly={true}
                    lineNumbers={false}
                    mode="javascript"
                    value={codeframe({
                        source: code,
                        error: parseResult.error,
                    })}
                />
            </div>
        );
    else if (ast)
        output = (
            <Visualization
                parseResult={parseResult}
                focusPath={focusPath}
            />
        );
    
    const names = visualizations
        .map(getName)
        .map(clearName);
    
    const buttons = names.map(Button({
        selectedOutput,
        setSelectedOutput,
    }));
    
    return (
        <div className="output highlight" data-testid="ast-output">
            <div className="toolbar">
                {buttons}
                <span className="time">
                    {formatTime(parseResult?.time)}
                </span>
            </div>
            {output}
        </div>
    );
}
