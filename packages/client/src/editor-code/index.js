import {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {codeframe} from 'putout';

const PARSE_ERRORS = new Set(['SyntaxError', 'ParseError']);

function formatError(error, transformCode) {
    if (!PARSE_ERRORS.has(error.constructor.name))
        return error.toString();
    
    return codeframe({
        source: transformCode,
        error,
    });
}
import {Editor} from '#editor';

async function runTransform(transformer, transformCode, code, parser) {
    if (!transformer._promise)
        transformer._promise = new Promise(transformer.loadTransformer);
    
    const realTransformer = await transformer._promise;
    
    return transformer.transform(realTransformer, transformCode, code, parser);
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
        <div className="output highlight" data-testid="editor-transform-output">
            {error
                ? <div className="container">
                    <Editor
                        key="error"
                        lineNumbers={false}
                        mode="javascript"
                        readOnly={true}
                        value={formatError(error, transformCode)}
                    />
                </div>
                : <Editor
                    mode={mode}
                    key="output"
                    readOnly={true}
                    value={result}
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
