import {useState, useEffect} from 'react';
import {codeframe} from 'putout';
import {Editor} from '#editor';

const PARSE_ERRORS = new Set([
    'SyntaxError',
    'ParseError',
]);

function formatError(error: Error, transformCode: string): string {
    if (!PARSE_ERRORS.has(error.constructor.name))
        return error.toString();
    
    return codeframe({
        source: transformCode,
        error,
    });
}

async function runTransform(transformer: any, transformCode: string, code: string, parser: string): Promise<string> {
    if (!transformer._promise)
        transformer._promise = new Promise(transformer.loadTransformer);
    
    const realTransformer = await transformer._promise;
    
    return transformer.transform(realTransformer, transformCode, code, parser);
}

interface EditorResultProps {
    transformer: any;
    transformCode: string;
    code: string;
    mode: string;
    isLoading: boolean;
    parser: string;
}

export default function EditorResult({transformer, transformCode, code, mode, isLoading, parser}: EditorResultProps) {
    const [result, setResult] = useState('');
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
        if (isLoading)
            return;
        
        if (console.clear)
            console.clear();
        
        runTransform(transformer, transformCode, code, parser)
            .then((transformResult: string) => {
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
