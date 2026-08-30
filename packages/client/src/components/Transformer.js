import PropTypes from 'prop-types';
import React from 'react';
import Editor from './Editor';
import SplitPane from './SplitPane';
import TransformOutput from './TransformOutput';
import {getTransformerByID} from '../parsers/index.js';

export default function Transformer(props) {
    // 🐊Putout transformer only have
    const {transformer = getTransformerByID('putout')} = props;
    
    const plainEditor = React.createElement(Editor, {
        highlight: false,
        value: props.transformCode,
        onContentChange: props.onContentChange,
        onBlur: props.onBlur,
        keyMap: props.keyMap,
    });
    
    const formattingEditor = (
        <div>
            {plainEditor}
        </div>
    );
    
    return (
        <SplitPane className="splitpane">
            {formattingEditor}
            <TransformOutput
                transformer={transformer}
                transformCode={props.transformCode}
                code={props.code}
                mode={props.mode}
                keyMap={props.keyMap}
                parser={props.parser}
                isLoading={props.isLoading}
            />
        </SplitPane>
    );
}

Transformer.propTypes = {
    defaultTransformCode: PropTypes.string,
    transformCode: PropTypes.string,
    transformer: PropTypes.object,
    code: PropTypes.string,
    mode: PropTypes.string,
    keyMap: PropTypes.string,
    onContentChange: PropTypes.func,
    onBlur: PropTypes.func,
    parser: PropTypes.string,
};
