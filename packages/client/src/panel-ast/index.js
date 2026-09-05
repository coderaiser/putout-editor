import {ErrorBoundary} from 'react-error-boundary';
import EditorASTTree from '../editor-ast-tree/index.js';

function ErrorFallback({error}) {
    return (
        <div className="error-boundary"><p>{error.message}</p></div>
    );
}

export default function AstPanel() {
    return (
        <ErrorBoundary fallbackRender={ErrorFallback}>
            <EditorASTTree/>
        </ErrorBoundary>
    );
}
