import CodeMirror from 'codemirror';
import 'codemirror/keymap/vim';
import 'codemirror/keymap/emacs';
import 'codemirror/keymap/sublime';
import PropTypes from 'prop-types';
import React from 'react';

const getCMTheme = () => document.documentElement.getAttribute('data-theme') === 'dark' ? 'nord' : 'default';

const noop = () => {};

const defaultPrettierOptions = {
    printWidth: 80,
    tabWidth: 4,
    singleQuote: true,
    bracketSpacing: false,
    jsxBracketSameLine: false,
    parser: 'babel',
    trailingComma: 'es5',
    arrowParens: 'always',
};

export default class Editor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.value,
        };
    }
    
    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.value !== this.state.value)
            this.setState({value: nextProps.value}, () => this.codeMirror.setValue(nextProps.value));
        
        if (nextProps.mode !== this.props.mode)
            this.codeMirror.setOption('mode', nextProps.mode);
        
        if (nextProps.keyMap !== this.props.keyMap)
            this.codeMirror.setOption('keyMap', nextProps.keyMap);
        
        this._setError(nextProps.error);
    }
    
    shouldComponentUpdate() {
        return false;
    }
    
    getValue() {
        return this.codeMirror?.getValue();
    }
    
    _getErrorLine(error) {
        return error.loc ? error.loc.line : error.lineNumber || error.line;
    }
    
    _setError(error) {
        if (this.codeMirror) {
            const oldError = this.props.error;
            
            if (oldError) {
                const lineNumber = this._getErrorLine(oldError);
                
                if (lineNumber)
                    this.codeMirror.removeLineClass(lineNumber - 1, 'text', 'errorMarker');
            }
            
            if (error) {
                const lineNumber = this._getErrorLine(error);
                
                if (lineNumber)
                    this.codeMirror.addLineClass(lineNumber - 1, 'text', 'errorMarker');
            }
        }
    }
    
    _posFromIndex(doc, index) {
        return (this.props.posFromIndex ? this.props : doc).posFromIndex(index);
    }
    
    componentDidMount() {
        this._CMHandlers = [];
        this.codeMirror = CodeMirror(this.container, {
            keyMap: this.props.keyMap,
            value: this.state.value,
            mode: this.props.mode,
            lineNumbers: this.props.lineNumbers,
            readOnly: this.props.readOnly,
            indentUnit: 4,
            theme: getCMTheme(),
        });
        
        // Watch for theme changes on <html data-theme>
        this._themeObserver = new MutationObserver(() => {
            this.codeMirror.setOption('theme', getCMTheme());
        });
        this._themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });
        
        this._bindCMHandler('blur', (instance) => {
            if (!this.props.enableFormatting)
                return;
            
            Promise
                .all([
                    import('prettier/standalone'),
                    import('prettier/parser-babel'),
                ])
                .then(([prettierMod, babelMod]) => {
                    const prettier = prettierMod.default || prettierMod;
                    const babel = babelMod.default || babelMod;
                    const currValue = instance.doc.getValue();
                    
                    const options = {
                        ...defaultPrettierOptions,
                        printWidth: instance.display.maxLineLength,
                        plugins: [babel],
                    };
                    
                    instance.doc.setValue(prettier.format(currValue, options));
                });
        });
        
        this._bindCMHandler('changes', () => {
            clearTimeout(this._updateTimer);
            this._updateTimer = setTimeout(this._onContentChange.bind(this), 200);
        });
        this._bindCMHandler('cursorActivity', () => {
            clearTimeout(this._updateTimer);
            this._updateTimer = setTimeout(this._onActivity.bind(this, true), 100);
        });
        
        if (this.props.error)
            this._setError(this.props.error);
    }
    
    componentWillUnmount() {
        clearTimeout(this._updateTimer);
        this._unbindHandlers();
        this._themeObserver?.disconnect();
        this._markerRange = null;
        this._mark = null;
        const {container} = this;
        
        container.removeChild(container.children[0]);
        this.codeMirror = null;
    }
    
    _bindCMHandler(event, handler) {
        this._CMHandlers.push(event, handler);
        this.codeMirror.on(event, handler);
    }
    
    _unbindHandlers() {
        const cmHandlers = this._CMHandlers;
        
        for (let i = 0; i < cmHandlers.length; i += 2) {
            this.codeMirror.off(cmHandlers[i], cmHandlers[i + 1]);
        }
    }
    
    _onContentChange() {
        const doc = this.codeMirror.getDoc();
        const args = {
            value: doc.getValue(),
            cursor: doc.indexFromPos(doc.getCursor()),
        };
        
        this.setState({value: args.value}, () => this.props.onContentChange(args));
    }
    
    _onActivity() {
        this.props.onActivity(this
            .codeMirror
            .getDoc()
            .indexFromPos(this.codeMirror.getCursor()));
    }
    
    render() {
        return (
            <div className="editor" ref={(c) => this.container = c}/>
        );
    }
}

Editor.propTypes = {
    value: PropTypes.string,
    highlight: PropTypes.bool,
    lineNumbers: PropTypes.bool,
    readOnly: PropTypes.bool,
    onContentChange: PropTypes.func,
    onActivity: PropTypes.func,
    posFromIndex: PropTypes.func,
    error: PropTypes.object,
    mode: PropTypes.string,
    enableFormatting: PropTypes.bool,
    keyMap: PropTypes.string,
};

Editor.defaultProps = {
    value: '',
    highlight: true,
    lineNumbers: true,
    readOnly: false,
    mode: 'javascript',
    keyMap: 'default',
    onContentChange: noop,
    onActivity: noop,
};
