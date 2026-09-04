import {
    useState,
    useEffect,
} from 'react';
import PropTypes from 'prop-types';
import stringify from 'json-stringify-safe';
import {Editor} from '#editor';
import EditorASTJson from '#editor-ast-json';

const isString = (value) => typeof value === 'string';

async function runTransform(transformer, transformCode, code, parser) {
    if (!transformer._promise)
        transformer._promise = new Promise(transformer.loadTransformer);
    
    const realTransformer = await transformer._promise;
    const result = transformer.transform(realTransformer, transformCode, code, parser);
    
    return isString(result) ? result : result.code;
}

export default function EditorResult({transformer, transformCode, code, mode, isLoading, parser}) {
    const [result, setResult] = useState('');
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (isLoading)
            return;
        
        if (console.clear)
            console.clear();
        
        runTransform(transformer, transformCode, code, parser)
            .then((transformResult) => {
                setResult(transformResult);
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
};
