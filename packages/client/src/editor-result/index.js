import {
    useState,
    useEffect,
    useRef,
} from 'react';
import PropTypes from 'prop-types';
import {SourceMapConsumer} from 'source-map';
import stringify from 'json-stringify-safe';
import Editor from '../editor/Editor.js';
import EditorASTJson from '../editor-ast-json/index.js';
import resolvePositionFromIndex from '../editor/resolvePositionFromIndex.js';

const isString = (value) => typeof value === 'string';

async function runTransform(transformer, transformCode, code, parser) {
    if (!transformer._promise)
        transformer._promise = new Promise(transformer.loadTransformer);
    
    const realTransformer = await transformer._promise;
    let result = transformer.transform(realTransformer, transformCode, code, parser);
    let sourceMap = null;
    
    if (!isString(result)) {
        if (result.map)
            sourceMap = new SourceMapConsumer(result.map);
        
        result = result.code;
    }
    
    return {
        result,
        sourceMap,
    };
}

export default function EditorResult({transformer, transformCode, code, mode, isLoading, parser, highlightRange}) {
    const [result, setResult] = useState('');
    const [sourceMap, setSourceMap] = useState(null);
    const [error, setError] = useState(null);
    const sourceMapRef = useRef(null);
    
    useEffect(() => {
        sourceMapRef.current = sourceMap;
    }, [sourceMap]);
    
    useEffect(() => {
        if (isLoading)
            return;
        
        if (console.clear)
            console.clear();
        
        runTransform(transformer, transformCode, code, parser)
            .then(({result: transformResult, sourceMap: newSourceMap}) => {
                setResult(transformResult);
                setSourceMap(newSourceMap);
                setError(null);
            })
            .catch(setError);
    }, [
        transformer,
        transformCode,
        code,
        isLoading,
        parser,
    ]);
    
    function posFromIndex(_, index) {
        return resolvePositionFromIndex(sourceMapRef.current, index);
    }
    
    return (
        <div className="output highlight">
            {error
                ? <Editor
                    highlight={false}
                    key="error"
                    lineNumbers={false}
                    readOnly={true}
                    value={error.stack}
                />
                : isString(result)
                    ? <Editor
                        highlightRange={highlightRange}
                        posFromIndex={posFromIndex}
                        mode={mode}
                        key="output"
                        readOnly={true}
                        value={result}
                    />
                    : <EditorASTJson
                        className="container no-toolbar"
                        value={stringify(result, null, 2)}
                    />}
        </div>
    );
}

EditorResult.propTypes = {
    transformer: PropTypes.object,
    transformCode: PropTypes.string,
    mode: PropTypes.string,
    code: PropTypes.string,
    isLoading: PropTypes.bool,
    parser: PropTypes.string,
    highlightRange: PropTypes.array,
};
