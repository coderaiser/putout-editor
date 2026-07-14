import PropTypes from 'prop-types';
import React from 'react';
import visualizations from './visualization';
import getFocusPath from './getFocusPath';
import {Button} from './visualization/Button';

const getName = (a) => a.name;

const {useState, useMemo} = React;

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

export default function ASTOutput({parser, parseResult = {}, cursor = null}) {
    const [selectedOutput, setSelectedOutput] = useState(0);
    const {ast = null} = parseResult;
    
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
        output = React.createElement(visualizations[selectedOutput], {
            parseResult,
            focusPath,
        });
    
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

ASTOutput.propTypes = {
    parser: PropTypes.object.isRequired,
    parseResult: PropTypes.object,
    cursor: PropTypes.any,
};
