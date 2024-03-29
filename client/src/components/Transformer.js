import Editor from './Editor';
import PropTypes from 'prop-types';
import PubSub from 'pubsub-js';
import React from 'react';
import SplitPane from './SplitPane';
import TransformOutput from './TransformOutput';
import PrettierButton from './buttons/PrettierButton';
import {getTransformerByID} from '../parsers';

function resize() {
    PubSub.publish('PANEL_RESIZE');
}

export default function Transformer(props) {
    // 🐊Putout transformer only have
    const {transformer = getTransformerByID('putout')} = props;
    
    const plainEditor = React.createElement(Editor, {
        highlight: false,
        value: props.transformCode,
        onContentChange: props.onContentChange,
        enableFormatting: props.enableFormatting,
        keyMap: props.keyMap,
    });
    
    const formattingEditor = <div>
        <PrettierButton toggleFormatting={props.toggleFormatting} enableFormatting={props.enableFormatting}/>
        {plainEditor}
    </div>
    ;
    
    return (
        <SplitPane
            className="splitpane"
            onResize={resize}
        >
            {formattingEditor}
            <TransformOutput
                transformer={transformer}
                transformCode={props.transformCode}
                code={props.code}
                mode={props.mode}
                keyMap={props.keyMap}
                parser={props.parser}
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
    toggleFormatting: PropTypes.func,
    enableFormatting: PropTypes.bool,
    parser: PropTypes.string,
};
