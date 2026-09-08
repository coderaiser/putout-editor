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
import visualizations from './visualization.js';
import {Button} from './Button.js';

const getName = (a) => a.displayName || a.name;

function formatTime(time) {
    if (!time)
        return null;
    
    if (time < 1000)
        return `${time}ms`;
    
    return `${(time / 1000).toFixed(2)}s`;
}

const clearName = (a) => a
    .split('_')
    .pop();

export default function EditorASTTree() {
    const parser = useSelector(getParser);
    const parseResult = useSelector(getParseResult) || {};
    const cursor = useSelector(getCursor);
    const code = useSelector(getCode);
    const [selectedOutput, setSelectedOutput] = useState(0);
    const {ast = null} = parseResult;
    const Visualization = visualizations[selectedOutput];
    
    if (!parser)
        throw Error('Parser not found');
    
    const focusPath = useMemo(() => ast && cursor != null ? getFocusPath(parseResult.ast, cursor, parser) : [], [ast, cursor, parser]);
    
    let output;
    
    if (parseResult.error)
        output = <div className="container">
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
        </div>;
    else if (ast)
        output = <Visualization
            parseResult={parseResult}
            focusPath={focusPath}
        />;
    
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
                    {formatTime(parseResult.time)}
                </span>
            </div>
            {output}
        </div>
    );
}
