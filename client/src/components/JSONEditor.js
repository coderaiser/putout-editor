import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/brace-fold';
import PropTypes from 'prop-types';
import PubSub from 'pubsub-js';
import React from 'react';

export default class Editor extends React.Component {
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.value !== this.codeMirror.getValue()) {
            // preserve scroll position
            const info = this.codeMirror.getScrollInfo();
            this.codeMirror.setValue(nextProps.value);
            this.codeMirror.scrollTo(info.left, info.top);
        }
    }
    
    shouldComponentUpdate() {
        return false;
    }
    
    componentDidMount() {
        this._subscriptions = [];
        this.codeMirror = CodeMirror(this.container, {
            value: this.props.value,
            mode: {
                name: 'javascript',
                json: true,
            },
            readOnly: true,
            lineNumbers: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        });
        
        this._subscriptions.push(PubSub.subscribe('PANEL_RESIZE', () => {
            if (this.codeMirror) {
                this.codeMirror.refresh();
            }
        }));
    }
    
    componentWillUnmount() {
        this._unbindHandlers();
        
        const {container} = this;
        
        container.removeChild(container.children[0]);
        this.codeMirror = null;
    }
    
    _unbindHandlers() {
        this._subscriptions.forEach(PubSub.unsubscribe);
    }
    
    render() {
        return (
            <div id="JSONEditor" className={this.props.className} ref={(c) => this.container = c}/>
        );
    }
}Editor.propTypes = {
    value: PropTypes.string,
    className: PropTypes.string,
};
