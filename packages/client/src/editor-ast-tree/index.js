import {useState, useMemo} from 'react';
import {useSelector} from 'react-redux';
import {getParser} from '#parser';
import {getParseResult, getCursor} from '#store';
import {getFocusPath} from '#editor';
import visualizations from './visualization.js';
import {Button} from './Button.js';

const getName = (a) => a.name;

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
    const [selectedOutput, setSelectedOutput] = useState(0);
    const {ast = null} = parseResult;
    const Visualization = visualizations[selectedOutput];
    
    const focusPath = useMemo(() => ast && cursor != null ? getFocusPath(parseResult.ast, cursor, parser) : [], [ast, cursor, parser]);
    
    let output;
    
    if (parseResult.error)
        output = <div
            style={{
                padding: 20,
            }}
        >
            {parseResult.error.message}
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
        <div className="output highlight">
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
